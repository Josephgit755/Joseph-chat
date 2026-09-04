const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Business = require("../models/Business");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const Subscription = require("../models/Subscription");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

const CINETPAY_URL =
  "https://api-checkout.cinetpay.com/v2/payment";

const CINETPAY_CHECK_URL =
  "https://api-checkout.cinetpay.com/v2/payment/check";

const COMMISSION_RATE =
  Number(
    process.env.ZENVazAPP_COMMISSION_RATE
  ) || 0.05;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "https://joseph-chat.vercel.app";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  "https://joseph-backend.onrender.com";

const getConfig = () => {
  if (
    !process.env.CINETPAY_API_KEY ||
    !process.env.CINETPAY_SITE_ID
  ) {
    throw new Error(
      "CinetPay environment variables are missing."
    );
  }

  return {
    apikey:
      process.env.CINETPAY_API_KEY,

    site_id:
      process.env.CINETPAY_SITE_ID,
  };
};

// =========================================================
// PRODUCT PAYMENT
// =========================================================

router.post(
  "/product",
  protect,
  async (req, res) => {
    try {
      const {
        orderId,
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID.",
        });
      }

      const order =
        await Order.findOne({
          _id: orderId,
          customerId: req.user.id,
        }).populate(
          "businessId"
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (
        order.paymentStatus ===
        "paid"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Order is already paid.",
        });
      }

      if (
        !Number.isInteger(
          order.totalAmount
        ) ||
        order.totalAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment amount.",
        });
      }

      const transactionId =
        `ZVZORD${Date.now()}${Math.floor(
          Math.random() * 100000
        )}`;

      const transaction =
        await Transaction.create({
          transactionId,

          provider:
            "cinetpay",

          type:
            "product-payment",

          userId:
            req.user.id,

          businessId:
            order.businessId._id,

          orderId:
            order._id,

          amount:
            order.totalAmount,

          currency:
            "XAF",

          status:
            "pending",

          metadata: {
            orderNumber:
              order.orderNumber,
          },
        });

      const user =
        await User.findById(
          req.user.id
        );

      const config =
        getConfig();

      const response =
        await fetch(
          CINETPAY_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "User-Agent":
                "ZenvaZapp/1.0",
            },

            body: JSON.stringify({
              apikey:
                config.apikey,

              site_id:
                config.site_id,

              transaction_id:
                transactionId,

              amount:
                order.totalAmount,

              currency:
                "XAF",

              description:
                `ZenvaZapp Order ${order.orderNumber}`,

              customer_id:
                String(
                  req.user.id
                ),

              customer_name:
                user?.fullName ||
                "ZenvaZapp Customer",

              customer_surname:
                user?.username ||
                "Customer",

              customer_email:
                user?.email ||
                "",

              customer_phone_number:
                user?.phone ||
                order.customerPhone ||
                "",

              customer_country:
                "CM",

              notify_url:
                `${BACKEND_URL}/api/payments/cinetpay/notify`,

              return_url:
                `${FRONTEND_URL}/payment-return`,

              channels:
                "ALL",

              lang:
                "en",

              metadata:
                transactionId,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        String(data?.code) !==
          "201"
      ) {
        transaction.status =
          "failed";

        transaction.providerResponse =
          data;

        await transaction.save();

        return res.status(400).json({
          success: false,
          message:
            data?.description ||
            data?.message ||
            "Payment initialization failed.",
        });
      }

      transaction.providerResponse =
        data;

      await transaction.save();

      order.paymentTransactionId =
        transactionId;

      await order.save();

      return res.json({
        success: true,

        transactionId,

        paymentUrl:
          data?.data?.payment_url,

        paymentToken:
          data?.data?.payment_token,
      });
    } catch (error) {
      console.error(
        "Product payment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to initialize payment.",
      });
    }
  }
);

// =========================================================
// CINETPAY WEBHOOK
// =========================================================

router.post(
  "/cinetpay/notify",
  async (req, res) => {
    try {
      const transactionId =
        req.body?.transaction_id ||
        req.query?.transaction_id;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message:
            "Transaction ID is required.",
        });
      }

      await verifyAndProcessTransaction(
        transactionId
      );

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error(
        "CinetPay notification error:",
        error
      );

      // Always acknowledge webhook.
      return res.status(200).json({
        success: false,
      });
    }
  }
);

// =========================================================
// VERIFY
// =========================================================

router.get(
  "/verify/:transactionId",
  protect,
  async (req, res) => {
    try {
      const {
        transactionId,
      } = req.params;

      const transaction =
        await Transaction.findOne({
          transactionId,
          userId:
            req.user.id,
        });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message:
            "Transaction not found.",
        });
      }

      const result =
        await verifyAndProcessTransaction(
          transactionId
        );

      return res.json({
        success: true,
        transaction:
          result,
      });
    } catch (error) {
      console.error(
        "Verify transaction error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify payment.",
      });
    }
  }
);

// =========================================================
// ACTUAL CINETPAY CHECK
// =========================================================

async function verifyAndProcessTransaction(
  transactionId
) {
  const config =
    getConfig();

  const response =
    await fetch(
      CINETPAY_CHECK_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "User-Agent":
            "ZenvaZapp/1.0",
        },

        body: JSON.stringify({
          apikey:
            config.apikey,

          site_id:
            config.site_id,

          transaction_id:
            transactionId,
        }),
      }
    );

  const data =
    await response.json();

  const transaction =
    await Transaction.findOne({
      transactionId,
    });

  if (!transaction) {
    throw new Error(
      "Local transaction not found."
    );
  }

  transaction.providerResponse =
    data;

  const code =
    String(
      data?.code || ""
    );

  const status =
    String(
      data?.data?.status || ""
    ).toUpperCase();

  if (
    code === "00" ||
    status === "ACCEPTED"
  ) {
    if (
      transaction.status !==
      "successful"
    ) {
      transaction.status =
        "successful";

      transaction.paidAt =
        new Date();

      transaction.providerTransactionId =
        data?.data?.operator_id ||
        "";

      transaction.paymentMethod =
        data?.data?.payment_method ||
        "";

      if (
        transaction.type ===
        "product-payment"
      ) {
        await processSuccessfulOrder(
          transaction
        );
      }

      if (
        transaction.type ===
        "subscription"
      ) {
        await processSuccessfulSubscription(
          transaction
        );
      }
    }
  } else if (
    [
      "600",
      "602",
      "604",
      "606",
      "627",
    ].includes(code)
  ) {
    transaction.status =
      "failed";

    if (
      transaction.type ===
      "product-payment"
    ) {
      await Order.updateOne(
        {
          _id:
            transaction.orderId,
        },
        {
          $set: {
            paymentStatus:
              "failed",
          },
        }
      );
    }

    if (
      transaction.type ===
      "subscription"
    ) {
      await Subscription.updateOne(
        {
          paymentTransactionId:
            transactionId,
        },
        {
          $set: {
            status:
              "failed",
          },
        }
      );
    }
  } else {
    transaction.status =
      "waiting";
  }

  await transaction.save();

  return transaction;
}

// =========================================================
// SUCCESSFUL PRODUCT PAYMENT
// =========================================================

async function processSuccessfulOrder(
  transaction
) {
  const order =
    await Order.findById(
      transaction.orderId
    );

  if (!order) {
    throw new Error(
      "Order not found."
    );
  }

  // Idempotency protection.
  if (
    order.paymentStatus ===
    "paid"
  ) {
    return;
  }

  const business =
    await Business.findById(
      transaction.businessId
    );

  if (!business) {
    throw new Error(
      "Business not found."
    );
  }

  const commission =
    Math.round(
      transaction.amount *
        COMMISSION_RATE
    );

  const sellerAmount =
    transaction.amount -
    commission;

  transaction.commission =
    commission;

  transaction.sellerAmount =
    sellerAmount;

  order.paymentStatus =
    "paid";

  order.status =
    "paid";

  await order.save();

  business.totalSales =
    Number(
      business.totalSales || 0
    ) + transaction.amount;

  business.totalCommission =
    Number(
      business.totalCommission || 0
    ) + commission;

  business.availableBalance =
    Number(
      business.availableBalance || 0
    ) + sellerAmount;

  business.orderCount =
    Number(
      business.orderCount || 0
    ) + 1;

  await business.save();

  for (
    const item of order.items
  ) {
    const product =
      await Product.findById(
        item.productId
      );

    if (!product) {
      continue;
    }

    if (
      !product.unlimitedStock
    ) {
      product.stock =
        Math.max(
          0,
          product.stock -
            item.quantity
        );

      if (
        product.stock ===
        0
      ) {
        product.isAvailable =
          false;
      }
    }

    product.salesCount =
      Number(
        product.salesCount || 0
      ) + item.quantity;

    await product.save();
  }

  transaction.metadata = {
    ...transaction.metadata,
    commissionRate:
      COMMISSION_RATE,
    sellerAmount,
  };
}

// =========================================================
// SUCCESSFUL PREMIUM
// =========================================================

async function processSuccessfulSubscription(
  transaction
) {
  const subscription =
    await Subscription.findOne({
      paymentTransactionId:
        transaction.transactionId,
    });

  if (!subscription) {
    throw new Error(
      "Subscription not found."
    );
  }

  if (
    subscription.status ===
    "active"
  ) {
    return;
  }

  const now =
    new Date();

  const end =
    new Date(now);

  if (
    subscription.billingCycle ===
    "yearly"
  ) {
    end.setFullYear(
      end.getFullYear() + 1
    );
  } else {
    end.setMonth(
      end.getMonth() + 1
    );
  }

  subscription.status =
    "active";

  subscription.startDate =
    now;

  subscription.endDate =
    end;

  await subscription.save();

  await User.updateOne(
    {
      _id:
        subscription.userId,
    },
    {
      $set: {
        plan:
          "zenva-premium",

        premiumStatus:
          "active",

        premiumBillingCycle:
          subscription.billingCycle,

        premiumStartDate:
          now,

        premiumEndDate:
          end,
      },
    }
  );

  if (
    subscription.businessId
  ) {
    await Business.updateOne(
      {
        _id:
          subscription.businessId,
      },
      {
        $set: {
          plan:
            "zenva-premium",

          subscriptionStatus:
            "active",
        },
      }
    );
  }
}

module.exports =
  router;
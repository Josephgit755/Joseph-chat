const express = require("express");

const User = require("../models/User");
const Business = require("../models/Business");
const Subscription = require("../models/Subscription");
const Transaction = require("../models/Transaction");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

const CINETPAY_URL =
  "https://api-checkout.cinetpay.com/v2/payment";

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "https://joseph-chat.vercel.app";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  "https://joseph-backend.onrender.com";

const PLANS = {
  monthly: {
    amount:
      Number(process.env.ZENVAPREMIUM_MONTHLY_PRICE) ||
      2500,
  },

  yearly: {
    amount:
      Number(process.env.ZENVAPREMIUM_YEARLY_PRICE) ||
      25000,
  },
};

const getConfig = () => {
  if (
    !process.env.CINETPAY_API_KEY ||
    !process.env.CINETPAY_SITE_ID
  ) {
    throw new Error(
      "CinetPay configuration is missing."
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
// START PREMIUM SUBSCRIPTION
// =========================================================

router.post(
  "/start",
  protect,
  async (req, res) => {
    try {
      const {
        billingCycle,
        businessId,
      } = req.body;

      if (
        ![
          "monthly",
          "yearly",
        ].includes(billingCycle)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Billing cycle must be monthly or yearly.",
        });
      }

      const amount =
        PLANS[billingCycle].amount;

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      let business = null;

      if (businessId) {
        business =
          await Business.findOne({
            _id: businessId,
            ownerId: req.user.id,
          });

        if (!business) {
          return res.status(403).json({
            success: false,
            message:
              "Business access denied.",
          });
        }
      }

      const transactionId =
        `ZVZPREM${Date.now()}${Math.floor(
          Math.random() * 100000
        )}`;

      const transaction =
        await Transaction.create({
          transactionId,
          provider: "cinetpay",
          type: "subscription",
          userId: req.user.id,
          businessId:
            business?._id || null,
          amount,
          currency: "XAF",
          status: "pending",
          metadata: {
            plan: "zenva-premium",
            billingCycle,
          },
        });

      const subscription =
        await Subscription.create({
          userId: req.user.id,
          businessId:
            business?._id || null,
          plan: "zenva-premium",
          billingCycle,
          amount,
          currency: "XAF",
          paymentProvider: "cinetpay",
          paymentTransactionId:
            transactionId,
          status: "pending",
        });

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

              amount,

              currency: "XAF",

              description:
                `ZenvaZapp Premium ${billingCycle}`,

              customer_id:
                String(req.user.id),

              customer_name:
                user.fullName ||
                "ZenvaZapp User",

              customer_surname:
                user.username ||
                "User",

              customer_email:
                user.email || "",

              customer_phone_number:
                user.phone || "",

              customer_country:
                "CM",

              notify_url:
                `${BACKEND_URL}/api/payments/cinetpay/notify`,

              return_url:
                `${FRONTEND_URL}/payment-return`,

              channels: "ALL",

              lang: "en",

              metadata:
                transactionId,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        String(data?.code) !== "201"
      ) {
        transaction.status =
          "failed";

        transaction.providerResponse =
          data;

        await transaction.save();

        subscription.status =
          "failed";

        await subscription.save();

        return res.status(400).json({
          success: false,
          message:
            data?.description ||
            data?.message ||
            "Unable to initialize Premium payment.",
        });
      }

      transaction.providerResponse =
        data;

      await transaction.save();

      return res.json({
        success: true,

        transactionId,

        subscriptionId:
          subscription._id,

        paymentUrl:
          data?.data?.payment_url,

        paymentToken:
          data?.data?.payment_token,

        amount,

        billingCycle,
      });
    } catch (error) {
      console.error(
        "Start Premium error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to start Premium subscription.",
      });
    }
  }
);

// =========================================================
// CURRENT PREMIUM STATUS
// =========================================================

router.get(
  "/mine",
  protect,
  async (req, res) => {
    try {
      const subscription =
        await Subscription.findOne({
          userId: req.user.id,
          status: "active",
        }).sort({
          endDate: -1,
        });

      const user =
        await User.findById(
          req.user.id
        ).select(
          "plan premiumStatus premiumBillingCycle premiumStartDate premiumEndDate"
        );

      return res.json({
        success: true,
        user,
        subscription,
      });
    } catch (error) {
      console.error(
        "Premium status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load Premium status.",
      });
    }
  }
);

module.exports = router;
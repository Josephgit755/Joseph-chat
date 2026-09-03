const express = require("express");
const mongoose = require("mongoose");

const Product = require("../models/Product");
const Business = require("../models/Business");
const Order = require("../models/Order");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

const validId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// =========================================================
// CREATE ORDER
// =========================================================

router.post("/", protect, async (req, res) => {
  try {
    const {
      businessId,
      items,
      deliveryFee = 0,
      deliveryAddress = "",
      customerPhone = "",
      customerNote = "",
    } = req.body;

    if (!validId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business ID.",
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Order has no items.",
      });
    }

    const business =
      await Business.findOne({
        _id: businessId,
        isPublic: true,
        isActive: true,
      });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found.",
      });
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      if (!validId(item.productId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      const product =
        await Product.findOne({
          _id: item.productId,
          businessId,
          isPublic: true,
          isAvailable: true,
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "One of the products is unavailable.",
        });
      }

      const quantity =
        Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product quantity.",
        });
      }

      if (
        !product.unlimitedStock &&
        quantity > product.stock
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name} does not have enough stock.`,
        });
      }

      const actualPrice =
        product.discountPrice !== null &&
        product.discountPrice !== undefined
          ? product.discountPrice
          : product.price;

      const itemSubtotal =
        actualPrice * quantity;

      subtotal += itemSubtotal;

      orderItems.push({
        productId:
          product._id,
        name: product.name,
        quantity,
        unitPrice:
          actualPrice,
        subtotal:
          itemSubtotal,
      });
    }

    const fee = Number(
      deliveryFee
    ) || 0;

    const totalAmount =
      subtotal + fee;

    const orderNumber =
      `ZVZ${Date.now()}${Math.floor(
        Math.random() * 1000
      )}`;

    const order =
      await Order.create({
        orderNumber,
        businessId,
        customerId:
          req.user.id,
        items: orderItems,
        subtotal,
        deliveryFee: fee,
        totalAmount,
        currency: "XAF",
        status:
          "payment-pending",
        paymentStatus:
          "pending",
        deliveryAddress,
        customerPhone,
        customerNote,
      });

    res.status(201).json({
      success: true,
      message:
        "Order created. Continue to payment.",
      order,
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create order.",
    });
  }
});

// =========================================================
// CUSTOMER ORDERS
// =========================================================

router.get(
  "/mine",
  protect,
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          customerId: req.user.id,
        })
          .populate(
            "businessId",
            "businessName logo city"
          )
          .sort({
            createdAt: -1,
          });

      res.json({
        success: true,
        orders,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Failed to load orders.",
      });
    }
  }
);

// =========================================================
// BUSINESS ORDERS
// =========================================================

router.get(
  "/business/:businessId",
  protect,
  async (req, res) => {
    try {
      const business =
        await Business.findOne({
          _id:
            req.params.businessId,
          ownerId: req.user.id,
        });

      if (!business) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      const orders =
        await Order.find({
          businessId:
            business._id,
        })
          .populate(
            "customerId",
            "fullName username phone profilePhoto"
          )
          .sort({
            createdAt: -1,
          });

      res.json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error(
        "Business orders error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load business orders.",
      });
    }
  }
);

// =========================================================
// UPDATE ORDER STATUS
// =========================================================

router.patch(
  "/:orderId/status",
  protect,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.orderId
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      const business =
        await Business.findOne({
          _id: order.businessId,
          ownerId: req.user.id,
        });

      if (!business) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      const allowed = [
        "processing",
        "shipped",
        "completed",
        "cancelled",
      ];

      if (
        !allowed.includes(
          req.body.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order status.",
        });
      }

      order.status =
        req.body.status;

      await order.save();

      res.json({
        success: true,
        order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Failed to update order.",
      });
    }
  }
);

module.exports = router;
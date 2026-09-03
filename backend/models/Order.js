const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "XAF",
      uppercase: true,
    },

    // ==========================================
    // ORDER STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "pending",
        "payment-pending",
        "paid",
        "processing",
        "shipped",
        "completed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    // ==========================================
    // PAYMENT STATUS
    // ==========================================

    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "unpaid",
      index: true,
    },

    paymentTransactionId: {
      type: String,
      default: "",
      index: true,
    },

    // ==========================================
    // DELIVERY
    // ==========================================

    deliveryAddress: {
      type: String,
      default: "",
      trim: true,
    },

    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },

    customerNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({
  businessId: 1,
  createdAt: -1,
});

orderSchema.index({
  customerId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Order",
  orderSchema
);
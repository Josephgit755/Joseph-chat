const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    provider: {
      type: String,
      enum: [
        "cinetpay",
        "internal",
        "manual",
      ],
      default: "cinetpay",
      index: true,
    },

    type: {
      type: String,
      enum: [
        "product-payment",
        "subscription",
        "promotion",
        "refund",
        "commission",
        "payout",
      ],
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    commission: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellerAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "XAF",
      uppercase: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "waiting",
        "successful",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      default: "",
    },

    providerTransactionId: {
      type: String,
      default: "",
    },

    providerResponseCode: {
      type: String,
      default: "",
    },

    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({
  businessId: 1,
  createdAt: -1,
});

transactionSchema.index({
  userId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);
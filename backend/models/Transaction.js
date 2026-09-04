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
      default: "cinetpay",
    },

    providerTransactionId: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: [
        "product-payment",
        "subscription",
        "refund",
        "payout",
      ],
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    },

    commission: {
      type: Number,
      default: 0,
    },

    sellerAmount: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "XAF",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "waiting",
        "successful",
        "failed",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);
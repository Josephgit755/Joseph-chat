const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
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

    plan: {
      type: String,
      enum: [
        "zenva-premium",
      ],
      required: true,
    },

    billingCycle: {
      type: String,
      enum: [
        "monthly",
        "yearly",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "XAF",
    },

    paymentProvider: {
      type: String,
      enum: [
        "cinetpay",
      ],
      default: "cinetpay",
    },

    paymentTransactionId: {
      type: String,
      default: "",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "expired",
        "cancelled",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Subscription",
  subscriptionSchema
);
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
        "free",
        "zenva-plus",
        "zenva-business",
      ],
      required: true,
      index: true,
    },

    billingCycle: {
      type: String,
      enum: [
        "monthly",
        "yearly",
      ],
      default: "monthly",
    },

    amount: {
      type: Number,
      required: true,
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
        "active",
        "cancelled",
        "expired",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    paymentTransactionId: {
      type: String,
      default: "",
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

    autoRenew: {
      type: Boolean,
      default: false,
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
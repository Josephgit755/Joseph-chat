const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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

    method: {
      type: String,
      enum: [
        "mobile-money",
        "bank",
      ],
      required: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    provider: {
      type: String,
      default: "",
      trim: true,
    },

    accountName: {
      type: String,
      default: "",
      trim: true,
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "requested",
        "processing",
        "paid",
        "rejected",
        "cancelled",
      ],
      default: "requested",
      index: true,
    },

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

payoutSchema.index({
  businessId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Payout",
  payoutSchema
);
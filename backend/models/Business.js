const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // =========================================================
    // BUSINESS INFORMATION
    // =========================================================

    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    category: {
      type: String,
      default: "General",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    country: {
      type: String,
      default: "CM",
      trim: true,
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },

    logo: {
      type: String,
      default: "",
      trim: true,
    },

    coverImage: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================================================
    // PUBLIC BUSINESS
    // =========================================================

    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // =========================================================
    // PLAN
    // =========================================================

    plan: {
      type: String,
      enum: [
        "free",
        "zenva-premium",
      ],
      default: "free",
      index: true,
    },

    subscriptionStatus: {
      type: String,
      enum: [
        "inactive",
        "active",
        "expired",
        "cancelled",
      ],
      default: "inactive",
      index: true,
    },

    // =========================================================
    // BUSINESS SETTINGS
    // =========================================================

    automaticRepliesEnabled: {
      type: Boolean,
      default: false,
    },

    automaticReplyMessage: {
      type: String,
      default: "",
      trim: true,
    },

    awayMessageEnabled: {
      type: Boolean,
      default: false,
    },

    awayMessage: {
      type: String,
      default: "",
      trim: true,
    },

    marketingEnabled: {
      type: Boolean,
      default: false,
    },

    openingHours: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // =========================================================
    // PAYOUT INFORMATION
    // =========================================================

    payoutMethod: {
      type: String,
      enum: [
        "",
        "mobile-money",
        "bank",
      ],
      default: "",
    },

    payoutProvider: {
      type: String,
      default: "",
      trim: true,
    },

    payoutPhone: {
      type: String,
      default: "",
      trim: true,
    },

    payoutAccountName: {
      type: String,
      default: "",
      trim: true,
    },

    payoutBankName: {
      type: String,
      default: "",
      trim: true,
    },

    payoutAccountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================================================
    // ANALYTICS
    // =========================================================

    profileViews: {
      type: Number,
      default: 0,
    },

    customerCount: {
      type: Number,
      default: 0,
    },

    productCount: {
      type: Number,
      default: 0,
    },

    orderCount: {
      type: Number,
      default: 0,
    },

    totalSales: {
      type: Number,
      default: 0,
    },

    totalCommission: {
      type: Number,
      default: 0,
    },

    availableBalance: {
      type: Number,
      default: 0,
    },

    pendingBalance: {
      type: Number,
      default: 0,
    },

    withdrawnBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Business",
  businessSchema
);
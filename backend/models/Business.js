const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    // ==========================================
    // BUSINESS OWNER
    // ==========================================

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      // IMPORTANT:
      // Do NOT use unique:true.
      // One user can own multiple businesses.
    },

    // ==========================================
    // BUSINESS INFORMATION
    // ==========================================

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
      maxlength: 2000,
    },

    category: {
      type: String,
      default: "General",
      trim: true,
      index: true,
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
      lowercase: true,
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
      index: true,
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

    // ==========================================
    // BUSINESS IMAGES
    // ==========================================

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

    // ==========================================
    // PUBLIC DISCOVERY
    // ==========================================

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
      index: true,
    },

    // ==========================================
    // OPENING HOURS
    // ==========================================

    openingHours: {
      monday: { type: String, default: "08:00-18:00" },
      tuesday: { type: String, default: "08:00-18:00" },
      wednesday: { type: String, default: "08:00-18:00" },
      thursday: { type: String, default: "08:00-18:00" },
      friday: { type: String, default: "08:00-18:00" },
      saturday: { type: String, default: "08:00-18:00" },
      sunday: { type: String, default: "Closed" },
    },

    // ==========================================
    // BUSINESS PLAN
    // ==========================================

    plan: {
      type: String,
      enum: [
        "free",
        "zenva-plus",
        "zenva-business",
      ],
      default: "free",
      index: true,
    },

    subscriptionStatus: {
      type: String,
      enum: [
        "inactive",
        "active",
        "cancelled",
        "expired",
      ],
      default: "inactive",
      index: true,
    },

    // ==========================================
    // AUTOMATIC REPLIES
    // ==========================================

    automaticRepliesEnabled: {
      type: Boolean,
      default: false,
    },

    automaticReplyMessage: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    awayMessageEnabled: {
      type: Boolean,
      default: false,
    },

    awayMessage: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    // ==========================================
    // MARKETING
    // ==========================================

    marketingEnabled: {
      type: Boolean,
      default: false,
    },

    // ==========================================
    // ANALYTICS
    // ==========================================

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

    // ==========================================
    // FINANCIAL SUMMARY
    // ==========================================

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

    // ==========================================
    // PAYOUT INFORMATION
    // ==========================================

    payoutMethod: {
      type: String,
      enum: [
        "",
        "mobile-money",
        "bank",
      ],
      default: "",
    },

    payoutPhone: {
      type: String,
      default: "",
      trim: true,
    },

    payoutProvider: {
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
  },
  {
    timestamps: true,
  }
);

// ==========================================
// INDEXES
// ==========================================

businessSchema.index({
  businessName: "text",
  description: "text",
  category: "text",
  city: "text",
});

businessSchema.index({
  isPublic: 1,
  isActive: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Business",
  businessSchema
);
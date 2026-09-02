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
      unique: true,
      index: true,
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

    website: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // BUSINESS IMAGE
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

    // ==========================================
    // PREMIUM / PLAN
    // ==========================================

    plan: {
      type: String,
      enum: [
        "free",
        "zenva-plus",
        "zenva-business",
      ],
      default: "zenva-business",
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
      default: "active",
    },

    // ==========================================
    // BUSINESS FEATURES
    // ==========================================

    automaticRepliesEnabled: {
      type: Boolean,
      default: false,
    },

    automaticReplyMessage: {
      type: String,
      default: "",
      trim: true,
    },

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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Business",
  businessSchema
);
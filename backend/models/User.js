const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =========================================================
    // ACCOUNT
    // =========================================================

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // =========================================================
    // PROFILE
    // =========================================================

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    displayName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },

    gender: {
      type: String,
      enum: [
        "",
        "male",
        "female",
        "other",
        "prefer-not-to-say",
      ],
      default: "",
    },

    // =========================================================
    // ZENVA PREMIUM
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

    premiumStatus: {
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

    premiumBillingCycle: {
      type: String,
      enum: [
        "monthly",
        "yearly",
        "",
      ],
      default: "",
    },

    premiumStartDate: {
      type: Date,
      default: null,
    },

    premiumEndDate: {
      type: Date,
      default: null,
    },

    // =========================================================
    // LOGIN OTP
    // =========================================================

    loginOTP: {
      type: String,
      default: "",
    },

    loginOTPExpiresAt: {
      type: Date,
      default: null,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    lastOTPVerifiedAt: {
      type: Date,
      default: null,
    },

    lastOTPRequestedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "User",
  userSchema
);
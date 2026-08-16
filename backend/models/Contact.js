const mongoose = require("mongoose");

// ==========================================
// ZENVAZAPP CONTACT MODEL
// ==========================================

const contactSchema = new mongoose.Schema(
  {
    // ========================================
    // OWNER
    // ========================================

    owner: {
      type:
        mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // CONTACT
    // Registered ZenvaZapp user
    // ========================================

    contact: {
      type:
        mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // OPTIONAL NICKNAME
    // ========================================

    nickname: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    // ========================================
    // FAVORITE
    // ========================================

    favorite: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // LAST CONTACTED
    // ========================================

    lastContactedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// PREVENT DUPLICATE CONTACTS
// ==========================================

contactSchema.index(
  {
    owner: 1,
    contact: 1,
  },
  {
    unique: true,
  }
);

// ==========================================
// EXPORT
// ==========================================

module.exports =
  mongoose.model(
    "Contact",
    contactSchema
  );
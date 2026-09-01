const mongoose = require("mongoose");

// ==========================================
// ZENVAZAPP CONTACT MODEL
// ==========================================

const contactSchema = new mongoose.Schema(
  {
    // ========================================
    // OWNER (The user adding the contact)
    // ========================================
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // CONTACT (Registered ZenvaZapp User)
    // ========================================
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================
    // OPTIONAL METADATA
    // ========================================
    nickname: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    // ========================================
    // FAVORITE STATUS
    // ========================================
    favorite: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // LAST CONTACTED TIMESTAMP
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
// PREVENT DUPLICATE CONTACTS PER USER
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

module.exports = mongoose.model("Contact", contactSchema);
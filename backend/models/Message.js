const mongoose = require("mongoose");

// ==========================================
// MESSAGE SCHEMA
// ==========================================

const messageSchema = new mongoose.Schema(
  {
    // ========================================
    // CONVERSATION
    // ========================================

    conversationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    // ========================================
    // SENDER
    // ========================================

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ========================================
    // RECEIVER
    // ========================================

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ========================================
    // MESSAGE CONTENT
    // ========================================

    text: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================
    // MESSAGE TYPE
    // ========================================

    messageType: {
      type: String,
      default: "text",
      trim: true,
    },

    // ========================================
    // MESSAGE STATUS
    // sent -> delivered -> read
    // ========================================

    status: {
      type: String,
      enum: [
        "sent",
        "delivered",
        "read",
      ],
      default: "sent",
    },

    // ========================================
    // EDITED
    // ========================================

    edited: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // DELETE FOR SENDER
    // ========================================

    deletedForSender: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // DELETE FOR RECEIVER
    // ========================================

    deletedForReceiver: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // DELETE FOR EVERYONE
    // ========================================

    deletedForEveryone: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // UNDONE / REMOVED MESSAGE
    // ========================================

    undone: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // DISAPPEARING MESSAGE SETTING
    // off / 24h / 7d / 90d
    // ========================================

    disappearingDuration: {
      type: String,
      default: "off",
    },

    // ========================================
    // MESSAGE EXPIRATION
    // ========================================

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// INDEX FOR FAST CONVERSATION LOADING
// ==========================================

messageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

// ==========================================
// EXPORT MONGOOSE MODEL
// ==========================================

module.exports =
  mongoose.model(
    "Message",
    messageSchema
  );
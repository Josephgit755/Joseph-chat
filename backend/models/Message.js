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
      index: true,
    },

    // ========================================
    // RECEIVER
    // ========================================

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
      enum: [
        "text",
        "image",
        "video",
        "audio",
        "file",
        "voice",
        "system",
      ],
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
      index: true,
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
    // UNDONE
    // ========================================
    //
    // This is kept separate from deletion.
    // It represents a message that was undone
    // by the application's undo functionality.
    //
    // Do NOT use this field for disappearing
    // messages or delete-for-everyone.
    // ========================================

    undone: {
      type: Boolean,
      default: false,
    },

    // ========================================
    // DISAPPEARING MESSAGE DURATION
    // ========================================
    //
    // Stored in milliseconds:
    //
    // 0                   = off
    // 86400000            = 24 hours
    // 604800000           = 7 days
    // 7776000000          = 90 days
    // ========================================

    disappearingDuration: {
      type: Number,
      enum: [
        0,
        24 * 60 * 60 * 1000,
        7 * 24 * 60 * 60 * 1000,
        90 * 24 * 60 * 60 * 1000,
      ],
      default: 0,
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
// INDEX FOR EXPIRING MESSAGES
// ==========================================

messageSchema.index({
  expiresAt: 1,
});

// ==========================================
// EXPORT MONGOOSE MODEL
// ==========================================

module.exports =
  mongoose.model(
    "Message",
    messageSchema
  );
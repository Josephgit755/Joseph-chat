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
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    // ========================================
    // RECEIVER
    // ========================================

    receiverId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    // ========================================
    // MESSAGE TEXT
    // ========================================

    text: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
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
        "location",
        "contact",
      ],
      default: "text",
      index: true,
    },

    // ========================================
    // MESSAGE STATUS
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

    editedAt: {
      type: Date,
      default: null,
    },

    // ========================================
    // DELETE FOR SENDER
    // ========================================

    deletedForSender: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ========================================
    // DELETE FOR RECEIVER
    // ========================================

    deletedForReceiver: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ========================================
    // DELETE FOR EVERYONE
    // ========================================

    deletedForEveryone: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    // ========================================
    // UNDO / UNSEND
    // ========================================

    undone: {
      type: Boolean,
      default: false,
      index: true,
    },

    undoneAt: {
      type: Date,
      default: null,
    },

    // ========================================
    // DISAPPEARING MESSAGE
    // ========================================
    //
    // 0          = never disappear
    // 86400000   = 24 hours
    // 604800000  = 7 days
    // 7776000000 = 90 days
    //
    // IMPORTANT:
    // These values are milliseconds because
    // JavaScript Date calculations use
    // milliseconds.
    //
    // expiresAt stores the exact expiration
    // timestamp.
    // ========================================

    disappearingDuration: {
      type: Number,
      enum: [
        0,
        86400000,
        604800000,
        7776000000,
      ],
      default: 0,
      index: true,
    },

    // ========================================
    // MESSAGE EXPIRATION
    // ========================================
    //
    // Do NOT add index: true here.
    // The TTL index below handles expiration.
    //
    // null = never automatically expires.
    // ========================================

    expiresAt: {
      type: Date,
      default: null,
    },

    // ========================================
    // OPTIONAL MEDIA INFORMATION
    // ========================================

    mediaUrl: {
      type: String,
      default: "",
      trim: true,
    },

    mediaName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 255,
    },

    mediaSize: {
      type: Number,
      default: 0,
    },

    // ========================================
    // AUDIO INFORMATION
    // ========================================

    audioDuration: {
      type: Number,
      default: 0,
    },

    // ========================================
    // REPLY / FORWARD SUPPORT
    // ========================================

    replyToMessageId: {
      type: String,
      default: null,
    },

    forwarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// TTL INDEX
// ==========================================
//
// MongoDB automatically removes a message
// when expiresAt is reached.
//
// Messages with expiresAt: null are ignored.
//
// IMPORTANT:
// This is the ONLY index definition for
// expiresAt in this schema.
// ==========================================

messageSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      expiresAt: {
        $type: "date",
      },
    },
  }
);

// ==========================================
// CONVERSATION + CREATED DATE INDEX
// ==========================================

messageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

// ==========================================
// CONVERSATION + SENDER INDEX
// ==========================================

messageSchema.index({
  conversationId: 1,
  senderId: 1,
});

// ==========================================
// CONVERSATION + RECEIVER INDEX
// ==========================================

messageSchema.index({
  conversationId: 1,
  receiverId: 1,
});

// ==========================================
// PRE-SAVE: EDIT TIMESTAMP
// ==========================================

messageSchema.pre("save", function () {
  if (
    this.isModified("edited") &&
    this.edited === true
  ) {
    this.editedAt =
      this.editedAt || new Date();
  }
});

// ==========================================
// PRE-SAVE: UNDO TIMESTAMP
// ==========================================

messageSchema.pre("save", function () {
  if (
    this.isModified("undone") &&
    this.undone === true
  ) {
    this.undoneAt =
      this.undoneAt || new Date();
  }
});

// ==========================================
// PRE-SAVE: DELETE TIMESTAMP
// ==========================================

messageSchema.pre("save", function () {
  if (
    this.deletedForEveryone === true &&
    !this.deletedAt
  ) {
    this.deletedAt = new Date();
  }
});

// ==========================================
// EXPORT MODEL
// ==========================================

module.exports = mongoose.model(
  "Message",
  messageSchema
);
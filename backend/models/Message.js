const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },

    senderId: {
      type: String,
      required: true,
    },

    receiverId: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      trim: true,
      default: "",
    },

    messageType: {
      type: String,
      enum: [
        "text",
        "image",
        "video",
        "audio",
        "file",
      ],
      default: "text",
    },

    status: {
      type: String,
      enum: [
        "sent",
        "delivered",
        "read",
      ],
      default: "sent",
    },

    deletedForSender: {
      type: Boolean,
      default: false,
    },

    deletedForReceiver: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Message",
  messageSchema
);
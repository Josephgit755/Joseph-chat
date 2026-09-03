const mongoose = require("mongoose");

const businessMessageSchema =
  new mongoose.Schema(
    {
      businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: true,
        index: true,
      },

      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      senderType: {
        type: String,
        enum: [
          "customer",
          "business",
        ],
        required: true,
      },

      conversationId: {
        type: String,
        required: true,
        index: true,
      },

      text: {
        type: String,
        default: "",
        trim: true,
      },

      messageType: {
        type: String,
        enum: [
          "text",
          "image",
          "file",
          "product",
          "system",
        ],
        default: "text",
      },

      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
      },

      mediaUrl: {
        type: String,
        default: "",
      },

      read: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

businessMessageSchema.index({
  businessId: 1,
  customerId: 1,
  createdAt: 1,
});

module.exports = mongoose.model(
  "BusinessMessage",
  businessMessageSchema
);
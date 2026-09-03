const mongoose = require("mongoose");

const businessPostSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    excerpt: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    coverImage: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "General",
      trim: true,
      maxlength: 80,
    },

    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

businessPostSchema.index({
  businessId: 1,
  createdAt: -1,
});

businessPostSchema.index({
  isPublic: 1,
  isPublished: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "BusinessPost",
  businessPostSchema
);
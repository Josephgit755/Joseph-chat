const mongoose = require("mongoose");

const businessProductSchema = new mongoose.Schema(
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

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "XAF",
      trim: true,
      maxlength: 10,
    },

    image: {
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

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    type: {
      type: String,
      enum: ["product", "service"],
      default: "product",
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

businessProductSchema.index({
  businessId: 1,
  createdAt: -1,
});

businessProductSchema.index({
  businessId: 1,
  isPublic: 1,
  isAvailable: 1,
});

module.exports = mongoose.model(
  "BusinessProduct",
  businessProductSchema
);
const mongoose = require("mongoose");

const promotionSchema =
  new mongoose.Schema(
    {
      businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: true,
        index: true,
      },

      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      image: {
        type: String,
        default: "",
      },

      budget: {
        type: Number,
        default: 0,
        min: 0,
      },

      spent: {
        type: Number,
        default: 0,
        min: 0,
      },

      startDate: {
        type: Date,
        required: true,
      },

      endDate: {
        type: Date,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "draft",
          "active",
          "paused",
          "completed",
          "cancelled",
        ],
        default: "draft",
        index: true,
      },

      impressions: {
        type: Number,
        default: 0,
      },

      clicks: {
        type: Number,
        default: 0,
      },

      conversions: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
     "Promotion",
     promotionSchema
    );
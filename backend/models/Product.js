const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 3000,
    },

    category: {
      type: String,
      default: "General",
      trim: true,
      index: true,
    },

    productCode: {
      type: String,
      default: "",
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    currency: {
      type: String,
      default: "XAF",
      uppercase: true,
      trim: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    unlimitedStock: {
      type: Boolean,
      default: false,
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

    views: {
      type: Number,
      default: 0,
    },

    salesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({
  businessId: 1,
  createdAt: -1,
});

productSchema.index({
  name: "text",
  description: "text",
  category: "text",
});

module.exports = mongoose.model(
  "Product",
  productSchema
);
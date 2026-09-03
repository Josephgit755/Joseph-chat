const express = require("express");
const mongoose = require("mongoose");

const Product = require("../models/Product");
const Business = require("../models/Business");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

const validId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// =========================================================
// CREATE PRODUCT
// =========================================================

router.post("/", protect, async (req, res) => {
  try {
    const {
      businessId,
      name,
      description,
      category,
      productCode,
      images,
      price,
      discountPrice,
      stock,
      unlimitedStock,
    } = req.body;

    if (!validId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business ID.",
      });
    }

    const business =
      await Business.findOne({
        _id: businessId,
        ownerId: req.user.id,
      });

    if (!business) {
      return res.status(403).json({
        success: false,
        message: "Business access denied.",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    const numericPrice = Number(price);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product price.",
      });
    }

    const product =
      await Product.create({
        businessId,
        name: name.trim(),
        description:
          description || "",
        category:
          category || "General",
        productCode:
          productCode || "",
        images:
          Array.isArray(images)
            ? images
            : [],
        price: numericPrice,
        discountPrice:
          discountPrice !== null &&
          discountPrice !== undefined
            ? Number(discountPrice)
            : null,
        stock:
          Number(stock) || 0,
        unlimitedStock:
          Boolean(unlimitedStock),
        isAvailable: true,
        isPublic: true,
      });

    business.productCount += 1;
    await business.save();

    res.status(201).json({
      success: true,
      message:
        "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Create product error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create product.",
    });
  }
});

// =========================================================
// MY PRODUCTS
// =========================================================

router.get(
  "/business/:businessId",
  protect,
  async (req, res) => {
    try {
      const { businessId } = req.params;

      const business =
        await Business.findOne({
          _id: businessId,
          ownerId: req.user.id,
        });

      if (!business) {
        return res.status(403).json({
          success: false,
          message: "Business access denied.",
        });
      }

      const products =
        await Product.find({
          businessId,
        }).sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        products,
      });
    } catch (error) {
      console.error(
        "Get products error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load products.",
      });
    }
  }
);

// =========================================================
// PUBLIC PRODUCTS
// =========================================================

router.get(
  "/public/:businessId",
  async (req, res) => {
    try {
      const products =
        await Product.find({
          businessId:
            req.params.businessId,
          isPublic: true,
          isAvailable: true,
        }).sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Failed to load products.",
      });
    }
  }
);

// =========================================================
// UPDATE PRODUCT
// =========================================================

router.patch(
  "/:productId",
  protect,
  async (req, res) => {
    try {
      const product =
        await Product.findById(
          req.params.productId
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      const business =
        await Business.findOne({
          _id: product.businessId,
          ownerId: req.user.id,
        });

      if (!business) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      const fields = [
        "name",
        "description",
        "category",
        "productCode",
        "images",
        "price",
        "discountPrice",
        "stock",
        "unlimitedStock",
        "isAvailable",
        "isPublic",
      ];

      fields.forEach((field) => {
        if (
          req.body[field] !== undefined
        ) {
          product[field] =
            req.body[field];
        }
      });

      await product.save();

      res.json({
        success: true,
        message:
          "Product updated successfully.",
        product,
      });
    } catch (error) {
      console.error(
        "Update product error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update product.",
      });
    }
  }
);

// =========================================================
// DELETE PRODUCT
// =========================================================

router.delete(
  "/:productId",
  protect,
  async (req, res) => {
    try {
      const product =
        await Product.findById(
          req.params.productId
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      const business =
        await Business.findOne({
          _id: product.businessId,
          ownerId: req.user.id,
        });

      if (!business) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      await Product.deleteOne({
        _id: product._id,
      });

      business.productCount =
        Math.max(
          0,
          business.productCount - 1
        );

      await business.save();

      res.json({
        success: true,
        message:
          "Product deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete product.",
      });
    }
  }
);

module.exports = router;
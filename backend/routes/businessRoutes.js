const express = require("express");
const mongoose = require("mongoose");

const Business = require("../models/Business");

const router = express.Router();


// ==========================================
// HELPER
// ==========================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};


// ==========================================
// TEST
// ==========================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "ZenvaZapp Business API is working",
  });
});


// ==========================================
// CREATE BUSINESS ACCOUNT
// ==========================================

router.post("/", async (req, res) => {
  try {
    const {
      ownerId,
      businessName,
      description,
      category,
      phone,
      email,
      address,
      website,
    } = req.body;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner ID is required.",
      });
    }

    if (!isValidObjectId(ownerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner ID.",
      });
    }

    if (!businessName || !businessName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Business name is required.",
      });
    }

    // ------------------------------------------
    // Prevent duplicate business accounts
    // ------------------------------------------

    const existingBusiness =
      await Business.findOne({
        ownerId,
      });

    if (existingBusiness) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a ZenvaZapp Business Account.",
        business: existingBusiness,
      });
    }

    // ------------------------------------------
    // Create business
    // ------------------------------------------

    const business = await Business.create({
      ownerId,
      businessName: businessName.trim(),
      description: description || "",
      category: category || "General",
      phone: phone || "",
      email: email || "",
      address: address || "",
      website: website || "",
      isPublic: true,
      isActive: true,
      plan: "zenva-business",
      subscriptionStatus: "active",
    });

    return res.status(201).json({
      success: true,
      message:
        "Business Account created successfully.",
      business,
    });

  } catch (error) {
    console.error(
      "Create Business Account error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create Business Account.",
    });
  }
});


// ==========================================
// GET MY BUSINESS
// ==========================================

router.get("/owner/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!isValidObjectId(ownerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner ID.",
      });
    }

    const business =
      await Business.findOne({
        ownerId,
      });

    if (!business) {
      return res.status(404).json({
        success: false,
        message:
          "Business Account not found.",
      });
    }

    return res.json({
      success: true,
      business,
    });

  } catch (error) {
    console.error(
      "Get Business Account error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load Business Account.",
    });
  }
});


// ==========================================
// GET ALL PUBLIC BUSINESSES
// ==========================================
//
// IMPORTANT:
// This endpoint is intentionally NOT restricted
// to the business owner's contacts.
//
// Every ZenvaZapp user can discover public
// businesses.
//

router.get("/public", async (req, res) => {
  try {
    const businesses =
      await Business.find({
        isPublic: true,
        isActive: true,
      })
        .select(
          "businessName description category logo coverImage ownerId"
        )
        .sort({
          createdAt: -1,
        });

    return res.json({
      success: true,
      businesses,
    });

  } catch (error) {
    console.error(
      "Get public businesses error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load public businesses.",
    });
  }
});


// ==========================================
// GET BUSINESS BY ID
// ==========================================

router.get("/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business ID.",
      });
    }

    const business =
      await Business.findOne({
        _id: businessId,
        isPublic: true,
        isActive: true,
      });

    if (!business) {
      return res.status(404).json({
        success: false,
        message:
          "Business not found.",
      });
    }

    return res.json({
      success: true,
      business,
    });

  } catch (error) {
    console.error(
      "Get Business error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load business.",
    });
  }
});


// ==========================================
// UPDATE MY BUSINESS
// ==========================================

router.patch("/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;
    const {
      ownerId,
      businessName,
      description,
      category,
      phone,
      email,
      address,
      website,
      logo,
      coverImage,
      isPublic,
    } = req.body;

    if (!isValidObjectId(businessId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business ID.",
      });
    }

    if (!ownerId || !isValidObjectId(ownerId)) {
      return res.status(400).json({
        success: false,
        message: "Valid owner ID is required.",
      });
    }

    const business =
      await Business.findOne({
        _id: businessId,
        ownerId,
      });

    if (!business) {
      return res.status(404).json({
        success: false,
        message:
          "Business Account not found.",
      });
    }

    if (businessName !== undefined) {
      business.businessName =
        businessName.trim();
    }

    if (description !== undefined) {
      business.description =
        description.trim();
    }

    if (category !== undefined) {
      business.category =
        category.trim();
    }

    if (phone !== undefined) {
      business.phone =
        phone.trim();
    }

    if (email !== undefined) {
      business.email =
        email.trim();
    }

    if (address !== undefined) {
      business.address =
        address.trim();
    }

    if (website !== undefined) {
      business.website =
        website.trim();
    }

    if (logo !== undefined) {
      business.logo =
        logo.trim();
    }

    if (coverImage !== undefined) {
      business.coverImage =
        coverImage.trim();
    }

    if (isPublic !== undefined) {
      business.isPublic =
        Boolean(isPublic);
    }

    await business.save();

    return res.json({
      success: true,
      message:
        "Business Account updated successfully.",
      business,
    });

  } catch (error) {
    console.error(
      "Update Business error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update Business Account.",
    });
  }
});


module.exports = router;
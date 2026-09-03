const express = require("express");
const mongoose = require("mongoose");

const Business = require("../models/Business");
const Transaction = require("../models/Transaction");
const Payout = require("../models/Payout");
const Product = require("../models/Product");
const Order = require("../models/Order");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// =========================================================
// TEST
// =========================================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "ZenvaZapp Business API is working",
  });
});

// =========================================================
// CREATE BUSINESS
// =========================================================

router.post("/", protect, async (req, res) => {
  try {
    const ownerId = req.user.id;

    const {
      businessName,
      description,
      category,
      phone,
      email,
      address,
      city,
      country,
      website,
    } = req.body;

    if (!businessName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Business name is required.",
      });
    }

    const business = await Business.create({
      ownerId,
      businessName: businessName.trim(),
      description: description || "",
      category: category || "General",
      phone: phone || "",
      email: email || "",
      address: address || "",
      city: city || "",
      country: country || "CM",
      website: website || "",
      isPublic: true,
      isActive: true,
      plan: "free",
      subscriptionStatus: "inactive",
    });

    res.status(201).json({
      success: true,
      message:
        "Business Account created successfully.",
      business,
    });
  } catch (error) {
    console.error(
      "Create business error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create business.",
    });
  }
});

// =========================================================
// GET ALL MY BUSINESSES
// =========================================================

router.get("/mine", protect, async (req, res) => {
  try {
    const businesses = await Business.find({
      ownerId: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      businesses,
    });
  } catch (error) {
    console.error(
      "Get my businesses error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load businesses.",
    });
  }
});

// =========================================================
// GET MY OLD SINGLE BUSINESS ENDPOINT
// =========================================================

router.get(
  "/owner/:ownerId",
  protect,
  async (req, res) => {
    try {
      const { ownerId } = req.params;

      if (String(ownerId) !== String(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      const businesses =
        await Business.find({
          ownerId,
        }).sort({
          createdAt: -1,
        });

      if (!businesses.length) {
        return res.status(404).json({
          success: false,
          message:
            "Business Account not found.",
        });
      }

      res.json({
        success: true,
        businesses,
        business: businesses[0],
      });
    } catch (error) {
      console.error(
        "Get owner businesses error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load Business Accounts.",
      });
    }
  }
);

// =========================================================
// UPDATE BUSINESS
// =========================================================

router.patch(
  "/:businessId",
  protect,
  async (req, res) => {
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
          ownerId: req.user.id,
        });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: "Business not found.",
        });
      }

      const allowedFields = [
        "businessName",
        "description",
        "category",
        "phone",
        "email",
        "address",
        "city",
        "country",
        "website",
        "logo",
        "coverImage",
        "isPublic",
        "isActive",
        "openingHours",
        "automaticRepliesEnabled",
        "automaticReplyMessage",
        "awayMessageEnabled",
        "awayMessage",
        "marketingEnabled",
        "payoutMethod",
        "payoutPhone",
        "payoutProvider",
        "payoutAccountName",
        "payoutBankName",
        "payoutAccountNumber",
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          business[field] = req.body[field];
        }
      });

      await business.save();

      res.json({
        success: true,
        message:
          "Business updated successfully.",
        business,
      });
    } catch (error) {
      console.error(
        "Update business error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update business.",
      });
    }
  }
);

// =========================================================
// PUBLIC BUSINESS DISCOVERY
// =========================================================

router.get("/public", async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      city = "",
      limit = 30,
    } = req.query;

    const filter = {
      isPublic: true,
      isActive: true,
    };

    if (category) {
      filter.category = category;
    }

    if (city) {
      filter.city = {
        $regex: city,
        $options: "i",
      };
    }

    if (search.trim()) {
      filter.$text = {
        $search: search.trim(),
      };
    }

    const businesses =
      await Business.find(filter)
        .select(
          "businessName description category logo coverImage city country isVerified profileViews"
        )
        .sort({
          createdAt: -1,
        })
        .limit(
          Math.min(
            Number(limit) || 30,
            100
          )
        );

    res.json({
      success: true,
      businesses,
    });
  } catch (error) {
    console.error(
      "Public business discovery error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load public businesses.",
    });
  }
});

// =========================================================
// PUBLIC BUSINESS PROFILE
// =========================================================

router.get(
  "/public/:businessId",
  async (req, res) => {
    try {
      const { businessId } = req.params;

      if (!isValidObjectId(businessId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid business ID.",
        });
      }

      const business =
        await Business.findOneAndUpdate(
          {
            _id: businessId,
            isPublic: true,
            isActive: true,
          },
          {
            $inc: {
              profileViews: 1,
            },
          },
          {
            new: true,
          }
        ).select(
          "-payoutPhone -payoutAccountNumber -payoutBankName"
        );

      if (!business) {
        return res.status(404).json({
          success: false,
          message: "Business not found.",
        });
      }

      const products =
        await Product.find({
          businessId,
          isPublic: true,
          isAvailable: true,
        }).sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        business,
        products,
      });
    } catch (error) {
      console.error(
        "Public business profile error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load business.",
      });
    }
  }
);

// =========================================================
// BUSINESS ANALYTICS
// =========================================================

router.get(
  "/:businessId/analytics",
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
        return res.status(404).json({
          success: false,
          message: "Business not found.",
        });
      }

      const [
        products,
        orders,
        paidOrders,
      ] = await Promise.all([
        Product.countDocuments({
          businessId,
        }),

        Order.countDocuments({
          businessId,
        }),

        Order.countDocuments({
          businessId,
          paymentStatus: "paid",
        }),
      ]);

      res.json({
        success: true,
        analytics: {
          profileViews:
            business.profileViews,
          customers:
            business.customerCount,
          products,
          orders,
          paidOrders,
          totalSales:
            business.totalSales,
          commission:
            business.totalCommission,
          availableBalance:
            business.availableBalance,
          pendingBalance:
            business.pendingBalance,
          withdrawnBalance:
            business.withdrawnBalance,
        },
      });
    } catch (error) {
      console.error(
        "Business analytics error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load analytics.",
      });
    }
  }
);

// =========================================================
// BUSINESS TRANSACTIONS
// =========================================================

router.get(
  "/:businessId/transactions",
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
        return res.status(404).json({
          success: false,
          message: "Business not found.",
        });
      }

      const transactions =
        await Transaction.find({
          businessId,
        })
          .populate(
            "orderId",
            "orderNumber totalAmount status"
          )
          .sort({
            createdAt: -1,
          })
          .limit(100);

      res.json({
        success: true,
        transactions,
      });
    } catch (error) {
      console.error(
        "Business transactions error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load transactions.",
      });
    }
  }
);

// =========================================================
// REQUEST PAYOUT
// =========================================================

router.post(
  "/:businessId/payouts",
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
        return res.status(404).json({
          success: false,
          message: "Business not found.",
        });
      }

      const amount = Number(
        req.body.amount
      );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid payout amount.",
        });
      }

      if (
        amount > business.availableBalance
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Insufficient available balance.",
        });
      }

      if (
        !business.payoutMethod
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Configure a payout method first.",
        });
      }

      const payout =
        await Payout.create({
          businessId,
          ownerId: req.user.id,
          amount,
          currency: "XAF",
          method:
            business.payoutMethod,
          phone:
            business.payoutPhone,
          provider:
            business.payoutProvider,
          accountName:
            business.payoutAccountName,
          bankName:
            business.payoutBankName,
          accountNumber:
            business.payoutAccountNumber,
          status: "requested",
        });

      business.availableBalance -= amount;
      business.pendingBalance += amount;

      await business.save();

      res.status(201).json({
        success: true,
        message:
          "Payout request submitted.",
        payout,
        balance: {
          available:
            business.availableBalance,
          pending:
            business.pendingBalance,
        },
      });
    } catch (error) {
      console.error(
        "Payout request error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to request payout.",
      });
    }
  }
);

// =========================================================
// PAYOUT HISTORY
// =========================================================

router.get(
  "/:businessId/payouts",
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
        return res.status(404).json({
          success: false,
          message: "Business not found.",
        });
      }

      const payouts =
        await Payout.find({
          businessId,
        }).sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        payouts,
      });
    } catch (error) {
      console.error(
        "Payout history error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load payouts.",
      });
    }
  }
);

module.exports = router;
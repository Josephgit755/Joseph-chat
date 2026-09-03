const express = require("express");
const mongoose = require("mongoose");

const Business = require("../models/Business");
const BusinessMessage = require("../models/BusinessMessage");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

const validId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

// =========================================================
// CONVERSATION ID
// =========================================================

const createConversationId = (
  businessId,
  customerId
) =>
  `business_${businessId}_${customerId}`;

// =========================================================
// SEND MESSAGE TO BUSINESS
// =========================================================

router.post(
  "/send",
  protect,
  async (req, res) => {
    try {
      const {
        businessId,
        text,
        productId = null,
      } = req.body;

      if (!validId(businessId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid business ID.",
        });
      }

      if (!text?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Message cannot be empty.",
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

      const conversationId =
        createConversationId(
          businessId,
          req.user.id
        );

      const message =
        await BusinessMessage.create({
          businessId,
          customerId:
            req.user.id,
          senderId:
            req.user.id,
          senderType:
            "customer",
          conversationId,
          text:
            text.trim(),
          messageType:
            productId
              ? "product"
              : "text",
          productId,
        });

      res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "Business message error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to send business message.",
      });
    }
  }
);

// =========================================================
// BUSINESS INBOX
// =========================================================

router.get(
  "/:businessId/inbox",
  protect,
  async (req, res) => {
    try {
      const business =
        await Business.findOne({
          _id:
            req.params.businessId,
          ownerId:
            req.user.id,
        });

      if (!business) {
        return res.status(403).json({
          success: false,
          message:
            "Business access denied.",
        });
      }

      const messages =
        await BusinessMessage.find({
          businessId:
            business._id,
        })
          .populate(
            "customerId",
            "fullName username profilePhoto phone"
          )
          .populate(
            "productId",
            "name price images"
          )
          .sort({
            createdAt: -1,
          })
          .limit(500);

      res.json({
        success: true,
        messages,
      });
    } catch (error) {
      console.error(
        "Business inbox error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load business inbox.",
      });
    }
  }
);

// =========================================================
// CUSTOMER CONVERSATION
// =========================================================

router.get(
  "/:businessId/customer/:customerId",
  protect,
  async (req, res) => {
    try {
      const {
        businessId,
        customerId,
      } = req.params;

      const business =
        await Business.findOne({
          _id: businessId,
          ownerId: req.user.id,
        });

      const isOwner =
        Boolean(business);

      const isCustomer =
        String(customerId) ===
        String(req.user.id);

      if (
        !isOwner &&
        !isCustomer
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Conversation access denied.",
        });
      }

      const conversationId =
        createConversationId(
          businessId,
          customerId
        );

      const messages =
        await BusinessMessage.find({
          conversationId,
        })
          .populate(
            "productId",
            "name price images"
          )
          .sort({
            createdAt: 1,
          });

      res.json({
        success: true,
        conversationId,
        messages,
      });
    } catch (error) {
      console.error(
        "Business conversation error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load conversation.",
      });
    }
  }
);

module.exports = router;
const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

// ==========================================
// CONSTANTS
// ==========================================

const DELETED_MESSAGE_TEXT =
  "This message was deleted.";

const DISAPPEARING_DURATIONS = [
  0,
  24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  90 * 24 * 60 * 60 * 1000,
];

// ==========================================
// TEST MESSAGE ROUTE
// ==========================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "ZenvaZapp message API is working",
  });
});

// ==========================================
// GET MESSAGES FOR A CONVERSATION
// ==========================================

router.get(
  "/:conversationId",
  async (req, res) => {
    try {
      const { conversationId } =
        req.params;

      const { userId } = req.query;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message:
            "Conversation ID is required.",
        });
      }

      const now = new Date();

      // ======================================
      // EXPIRE DISAPPEARING MESSAGES
      // ======================================

      await Message.updateMany(
        {
          conversationId,
          expiresAt: {
            $ne: null,
            $lte: now,
          },
          undone: false,
        },
        {
          $set: {
            undone: true,
            deletedForSender: true,
            deletedForReceiver: true,
          },
        }
      );

      // ======================================
      // LOAD MESSAGES
      // ======================================
      //
      // When userId is provided, ONLY return
      // messages visible to that specific user.
      //
      // This fixes the previous situation where
      // the $or condition could return a message
      // even when it had been deleted for the
      // current user.
      // ======================================

      let messageQuery = {
        conversationId,
        undone: false,
      };

      if (userId) {
        messageQuery.$or = [
          {
            senderId: userId,
            deletedForSender: false,
          },
          {
            receiverId: userId,
            deletedForReceiver: false,
          },
        ];
      } else {
        // Backward-compatible fallback for
        // existing frontend requests.
        messageQuery.$or = [
          {
            senderId: {
              $exists: true,
            },
            deletedForSender: false,
          },
          {
            receiverId: {
              $exists: true,
            },
            deletedForReceiver: false,
          },
        ];
      }

      const messages =
        await Message.find(
          messageQuery
        ).sort({
          createdAt: 1,
        });

      res.json({
        success: true,
        messages,
      });
    } catch (error) {
      console.error(
        "Get messages error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load messages.",
      });
    }
  }
);

// ==========================================
// SEND MESSAGE
// ==========================================

router.post(
  "/",
  async (req, res) => {
    try {
      const {
        conversationId,
        senderId,
        receiverId,
        text,
        messageType,
        disappearingDuration,
      } = req.body;

      if (
        !conversationId ||
        !senderId ||
        !receiverId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Conversation, sender and receiver are required.",
        });
      }

      if (
        messageType === "text" &&
        (!text || !text.trim())
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Message text cannot be empty.",
        });
      }

      // ======================================
      // NORMALIZE DISAPPEARING DURATION
      // ======================================

      let duration = 0;

      if (
        disappearingDuration !==
          undefined &&
        disappearingDuration !== null &&
        disappearingDuration !== "" &&
        disappearingDuration !== "off"
      ) {
        duration = Number(
          disappearingDuration
        );
      }

      if (
        !DISAPPEARING_DURATIONS.includes(
          duration
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid disappearing message duration.",
        });
      }

      // ======================================
      // CREATE EXPIRATION DATE
      // ======================================

      let expiresAt = null;

      if (duration > 0) {
        expiresAt = new Date(
          Date.now() + duration
        );
      }

      // ======================================
      // CREATE MESSAGE
      // ======================================

      const message =
        await Message.create({
          conversationId,
          senderId,
          receiverId,

          text: text
            ? text.trim()
            : "",

          messageType:
            messageType || "text",

          status: "sent",

          deletedForSender:
            false,

          deletedForReceiver:
            false,

          deletedForEveryone:
            false,

          undone: false,

          disappearingDuration:
            duration,

          expiresAt,
        });

      res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to send message.",
        error: error.message,
      });
    }
  }
);

// ==========================================
// EDIT MESSAGE
// ==========================================

router.patch(
  "/:messageId/edit",
  async (req, res) => {
    try {
      const { messageId } =
        req.params;

      const {
        userId,
        text,
      } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      if (
        !text ||
        !text.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Edited message cannot be empty.",
        });
      }

      const message =
        await Message.findById(
          messageId
        );

      if (!message) {
        return res.status(404).json({
          success: false,
          message:
            "Message not found.",
        });
      }

      if (
        String(message.senderId) !==
        String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the sender can edit this message.",
        });
      }

      if (
        message.deletedForEveryone ||
        message.undone ||
        message.deletedForSender
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This message can no longer be edited.",
        });
      }

      message.text =
        text.trim();

      message.edited = true;
      message.updatedAt =
        new Date();

      await message.save();

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "Edit message error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to edit message.",
        error: error.message,
      });
    }
  }
);

// ==========================================
// DELETE MESSAGE FOR ME
// ==========================================

router.patch(
  "/:messageId/delete-for-me",
  async (req, res) => {
    try {
      const { messageId } =
        req.params;

      const { userId } =
        req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      const message =
        await Message.findById(
          messageId
        );

      if (!message) {
        return res.status(404).json({
          success: false,
          message:
            "Message not found.",
        });
      }

      if (
        String(message.senderId) ===
        String(userId)
      ) {
        message.deletedForSender =
          true;
      } else if (
        String(message.receiverId) ===
        String(userId)
      ) {
        message.deletedForReceiver =
          true;
      } else {
        return res.status(403).json({
          success: false,
          message:
            "You cannot delete this message.",
        });
      }

      await message.save();

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "Delete for me error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete message for you.",
      });
    }
  }
);

// ==========================================
// DELETE MESSAGE FOR EVERYONE
// ==========================================

router.patch(
  "/:messageId/delete-for-everyone",
  async (req, res) => {
    try {
      const { messageId } =
        req.params;

      const { userId } =
        req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      const message =
        await Message.findById(
          messageId
        );

      if (!message) {
        return res.status(404).json({
          success: false,
          message:
            "Message not found.",
        });
      }

      if (
        String(message.senderId) !==
        String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the sender can delete this message for everyone.",
        });
      }

      message.deletedForEveryone =
        true;

      message.undone = true;

      message.deletedForSender =
        true;

      message.deletedForReceiver =
        true;

      message.text =
        DELETED_MESSAGE_TEXT;

      await message.save();

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "Delete for everyone error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete message for everyone.",
      });
    }
  }
);

// ==========================================
// DELETE ENTIRE CONVERSATION FOR CURRENT USER
// ==========================================

router.patch(
  "/conversation/:conversationId/delete",
  async (req, res) => {
    try {
      const {
        conversationId,
      } = req.params;

      const { userId } =
        req.body;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message:
            "Conversation ID is required.",
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      const conversationMessages =
        await Message.find({
          conversationId,
        }).select(
          "senderId receiverId"
        );

      if (
        conversationMessages.length ===
        0
      ) {
        return res.json({
          success: true,
          message:
            "Conversation is already empty.",
          deletedCount: 0,
        });
      }

      const isParticipant =
        conversationMessages.some(
          (item) =>
            String(item.senderId) ===
              String(userId) ||
            String(item.receiverId) ===
              String(userId)
        );

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message:
            "You are not a participant in this conversation.",
        });
      }

      const senderResult =
        await Message.updateMany(
          {
            conversationId,
            senderId: userId,
          },
          {
            $set: {
              deletedForSender: true,
            },
          }
        );

      const receiverResult =
        await Message.updateMany(
          {
            conversationId,
            receiverId: userId,
          },
          {
            $set: {
              deletedForReceiver: true,
            },
          }
        );

      const deletedCount =
        Number(
          senderResult.modifiedCount ||
            0
        ) +
        Number(
          receiverResult.modifiedCount ||
            0
        );

      res.json({
        success: true,
        message:
          "Conversation deleted for you.",
        conversationId,
        deletedCount,
      });
    } catch (error) {
      console.error(
        "Delete conversation error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete conversation.",
        error: error.message,
      });
    }
  }
);

// ==========================================
// MARK ALL INCOMING MESSAGES DELIVERED
// ==========================================

router.patch(
  "/:conversationId/delivered",
  async (req, res) => {
    try {
      const {
        conversationId,
      } = req.params;

      const { userId } =
        req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      const result =
        await Message.updateMany(
          {
            conversationId,
            receiverId: userId,
            status: "sent",
            deletedForReceiver: false,
          },
          {
            $set: {
              status: "delivered",
            },
          }
        );

      res.json({
        success: true,
        message:
          "Messages marked as delivered.",
        modifiedCount:
          result.modifiedCount,
      });
    } catch (error) {
      console.error(
        "Mark conversation messages delivered error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark messages as delivered.",
      });
    }
  }
);

// ==========================================
// MARK ALL INCOMING MESSAGES READ
// ==========================================

router.patch(
  "/:conversationId/read",
  async (req, res) => {
    try {
      const {
        conversationId,
      } = req.params;

      const { userId } =
        req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      const result =
        await Message.updateMany(
          {
            conversationId,
            receiverId: userId,
            status: {
              $in: [
                "sent",
                "delivered",
              ],
            },
            deletedForReceiver: false,
          },
          {
            $set: {
              status: "read",
            },
          }
        );

      res.json({
        success: true,
        message:
          "Messages marked as read.",
        modifiedCount:
          result.modifiedCount,
      });
    } catch (error) {
      console.error(
        "Mark conversation messages read error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark messages as read.",
      });
    }
  }
);

// ==========================================
// MARK INDIVIDUAL MESSAGE DELIVERED
// ==========================================

router.patch(
  "/:messageId/delivered",
  async (req, res) => {
    try {
      const { messageId } =
        req.params;

      const message =
        await Message.findByIdAndUpdate(
          messageId,
          {
            status:
              "delivered",
          },
          {
            new: true,
          }
        );

      if (!message) {
        return res.status(404).json({
          success: false,
          message:
            "Message not found.",
        });
      }

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "Mark message delivered error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark message as delivered.",
      });
    }
  }
);

// ==========================================
// MARK INDIVIDUAL MESSAGE READ
// ==========================================

router.patch(
  "/:messageId/read",
  async (req, res) => {
    try {
      const { messageId } =
        req.params;

      const message =
        await Message.findByIdAndUpdate(
          messageId,
          {
            status: "read",
          },
          {
            new: true,
          }
        );

      if (!message) {
        return res.status(404).json({
          success: false,
          message:
            "Message not found.",
        });
      }

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "Mark message read error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to mark message as read.",
      });
    }
  }
);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
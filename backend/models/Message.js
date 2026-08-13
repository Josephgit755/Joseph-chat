const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

// ==========================================
// CONSTANTS
// ==========================================

const DELETED_MESSAGE_TEXT =
  "This message was deleted.";

// ==========================================
// DISAPPEARING MESSAGE DURATIONS
// ==========================================

const DISAPPEARING_DURATIONS = {
  off: 0,

  "24h":
    24 *
    60 *
    60 *
    1000,

  "7d":
    7 *
    24 *
    60 *
    60 *
    1000,

  "90d":
    90 *
    24 *
    60 *
    60 *
    1000,
};

// ==========================================
// NORMALIZE DISAPPEARING DURATION
// ==========================================

const normalizeDisappearingDuration = (
  value
) => {
  // No setting supplied
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "off" ||
    value === 0 ||
    value === "0"
  ) {
    return {
      key: "off",
      milliseconds: 0,
    };
  }

  // Frontend format
  if (
    Object.prototype.hasOwnProperty.call(
      DISAPPEARING_DURATIONS,
      value
    )
  ) {
    return {
      key: value,
      milliseconds:
        DISAPPEARING_DURATIONS[value],
    };
  }

  // Numeric milliseconds support
  const numericValue = Number(value);

  if (
    Number.isFinite(numericValue) &&
    Object.values(
      DISAPPEARING_DURATIONS
    ).includes(numericValue)
  ) {
    const matchedKey =
      Object.keys(
        DISAPPEARING_DURATIONS
      ).find(
        (key) =>
          DISAPPEARING_DURATIONS[key] ===
          numericValue
      );

    return {
      key: matchedKey || "off",
      milliseconds:
        numericValue,
    };
  }

  return null;
};

// ==========================================
// TEST MESSAGE ROUTE
// ==========================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message:
      "ZenvaZapp message API is working",
  });
});

// ==========================================
// GET MESSAGES FOR A CONVERSATION
// ==========================================

router.get(
  "/:conversationId",
  async (req, res) => {
    try {
      const {
        conversationId,
      } = req.params;

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
      // LOAD VISIBLE MESSAGES
      // ======================================

      const messages =
        await Message.find({
          conversationId,

          undone: false,

          $or: [
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
          ],
        }).sort({
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
        expiresAt: requestedExpiresAt,
      } = req.body;

      // ======================================
      // REQUIRED FIELDS
      // ======================================

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

      // ======================================
      // TEXT VALIDATION
      // ======================================

      if (
        (messageType || "text") ===
          "text" &&
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

      const normalizedDuration =
        normalizeDisappearingDuration(
          disappearingDuration
        );

      if (!normalizedDuration) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid disappearing message duration.",
        });
      }

      const durationKey =
        normalizedDuration.key;

      const durationMilliseconds =
        normalizedDuration.milliseconds;

      // ======================================
      // CREATE EXPIRATION DATE
      // ======================================

      let expiresAt = null;

      if (durationMilliseconds > 0) {
        expiresAt = new Date(
          Date.now() +
            durationMilliseconds
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

          // Store the human-readable
          // duration used by the frontend.
          disappearingDuration:
            durationKey,

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

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
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
      const {
        messageId,
      } = req.params;

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

      // ======================================
      // ONLY SENDER CAN EDIT
      // ======================================

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

      // ======================================
      // BLOCK EDITING DELETED MESSAGES
      // ======================================

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

      // ======================================
      // UPDATE MESSAGE
      // ======================================

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

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
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
      const {
        messageId,
      } = req.params;

      const {
        userId,
      } = req.body;

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

      // ======================================
      // SENDER
      // ======================================

      if (
        String(message.senderId) ===
        String(userId)
      ) {
        message.deletedForSender =
          true;
      }

      // ======================================
      // RECEIVER
      // ======================================

      else if (
        String(message.receiverId) ===
        String(userId)
      ) {
        message.deletedForReceiver =
          true;
      }

      // ======================================
      // NOT A PARTICIPANT
      // ======================================

      else {
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
      const {
        messageId,
      } = req.params;

      const {
        userId,
      } = req.body;

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

      // ======================================
      // ONLY SENDER CAN DELETE FOR EVERYONE
      // ======================================

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

      // ======================================
      // ALREADY DELETED
      // ======================================

      if (
        message.deletedForEveryone ||
        message.undone
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This message has already been deleted.",
        });
      }

      // ======================================
      // DELETE FOR EVERYONE
      // ======================================

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
//
// This removes the conversation from the
// CURRENT USER'S side only.
//
// It does NOT delete the other person's copy.
//
// ==========================================

router.patch(
  "/conversation/:conversationId/delete",
  async (req, res) => {
    try {
      const {
        conversationId,
      } = req.params;

      const {
        userId,
      } = req.body;

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

      // ======================================
      // FIND CONVERSATION MESSAGES
      // ======================================

      const conversationMessages =
        await Message.find({
          conversationId,
        }).select(
          "senderId receiverId"
        );

      // ======================================
      // ALREADY EMPTY
      // ======================================

      if (
        conversationMessages.length ===
        0
      ) {
        return res.json({
          success: true,
          message:
            "Conversation is already empty.",
          conversationId,
          deletedCount: 0,
        });
      }

      // ======================================
      // VERIFY PARTICIPANT
      // ======================================

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

      // ======================================
      // DELETE USER'S SENT MESSAGES
      // ======================================

      const senderResult =
        await Message.updateMany(
          {
            conversationId,

            senderId: userId,

            deletedForSender: false,
          },
          {
            $set: {
              deletedForSender: true,
            },
          }
        );

      // ======================================
      // DELETE USER'S RECEIVED MESSAGES
      // ======================================

      const receiverResult =
        await Message.updateMany(
          {
            conversationId,

            receiverId: userId,

            deletedForReceiver: false,
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

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
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

      const {
        userId,
      } = req.body;

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

            undone: false,
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
          result.modifiedCount || 0,
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

      const {
        userId,
      } = req.body;

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

            undone: false,
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
          result.modifiedCount || 0,
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
      const {
        messageId,
      } = req.params;

      const {
        userId,
      } = req.body;

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

      // Only the receiver can mark
      // the message as delivered.
      if (
        String(message.receiverId) !==
        String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the receiver can mark this message as delivered.",
        });
      }

      if (
        message.deletedForReceiver ||
        message.undone
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This message is no longer available.",
        });
      }

      // Do not downgrade read
      // messages back to delivered.
      if (
        message.status !== "read"
      ) {
        message.status =
          "delivered";

        await message.save();
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
      const {
        messageId,
      } = req.params;

      const {
        userId,
      } = req.body;

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

      // Only the receiver can
      // mark the message as read.
      if (
        String(message.receiverId) !==
        String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the receiver can mark this message as read.",
        });
      }

      if (
        message.deletedForReceiver ||
        message.undone
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This message is no longer available.",
        });
      }

      message.status =
        "read";

      await message.save();

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
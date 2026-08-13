const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

// ==========================================
// CONSTANTS
// ==========================================

const DELETED_MESSAGE_TEXT =
  "This message was deleted.";

// Supported disappearing-message durations.
// 0 = never disappear.
const DISAPPEARING_DURATIONS = [
  0,
  24 * 60 * 60 * 1000, // 24 hours
  7 * 24 * 60 * 60 * 1000, // 7 days
  90 * 24 * 60 * 60 * 1000, // 90 days
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

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message:
            "Conversation ID is required.",
        });
      }

      const now = new Date();

      // Automatically mark expired
      // disappearing messages as undone.
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

      let duration = 0;

      if (
        disappearingDuration !==
        undefined
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

      let expiresAt = null;

      if (duration > 0) {
        expiresAt = new Date(
          Date.now() + duration
        );
      }

      const message = await Message.create({
        conversationId,
        senderId,
        receiverId,

       text: text
       ? text.trim()
       : "",

        messageType:
          messageType || "text",

         status: "sent",

         deletedForSender: false,

         deletedForReceiver: false,

         deletedForEveryone: false,

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

      // Only sender can edit.
      if (
        String(
          message.senderId
        ) !== String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the sender can edit this message.",
        });
      }

      // Cannot edit undone messages.
      if (message.undone) {
        return res.status(400).json({
          success: false,
          message:
            "This message has already been undone.",
        });
      }

      // Cannot edit deleted messages.
      if (
        message.deletedForSender ||
        message.deletedForReceiver
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Deleted messages cannot be edited.",
        });
      }

      message.text =
        text.trim();

      message.edited = true;

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
      });
    }
  }
);

// ==========================================
// UNDO / UNSEND MESSAGE
// ==========================================

router.patch(
  "/:messageId/undo",
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

      // Only sender can undo.
      if (
        String(
          message.senderId
        ) !== String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the sender can undo this message.",
        });
      }

      if (message.undone) {
        return res.status(400).json({
          success: false,
          message:
            "Message has already been undone.",
        });
      }

      message.undone = true;

      message.deletedForSender =
        true;

      message.deletedForReceiver =
        true;

      await message.save();

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "Undo message error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to undo message.",
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

      if (
        String(
          message.senderId
        ) === String(userId)
      ) {
        message.deletedForSender =
          true;
      } else if (
        String(
          message.receiverId
        ) === String(userId)
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
          "Failed to delete message.",
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

      // Only sender can delete
      // for everyone.
      if (
        String(
          message.senderId
        ) !== String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the sender can delete this message for everyone.",
        });
      }

      message.text =
        DELETED_MESSAGE_TEXT;

      message.deletedForSender =
        false;

      message.deletedForReceiver =
        false;

      message.deletedForEveryone =
        true;

      message.edited = false;

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
// SET DISAPPEARING MESSAGE DURATION
// ==========================================
//
// This stores the expiration duration
// on individual messages through the
// send-message request.
//
// This route is also provided so the
// frontend can validate/test a duration.

router.patch(
  "/:messageId/disappearing",
  async (req, res) => {
    try {
      const {
        messageId,
      } = req.params;

      const {
        userId,
        duration,
      } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      const numericDuration =
        Number(duration);

      if (
        !DISAPPEARING_DURATIONS.includes(
          numericDuration
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid disappearing message duration.",
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
        String(
          message.senderId
        ) !== String(userId) &&
        String(
          message.receiverId
        ) !== String(userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not part of this conversation.",
        });
      }

      message.expiresAt =
        numericDuration === 0
          ? null
          : new Date(
              Date.now() +
                numericDuration
            );

      await message.save();

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "Set disappearing message error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to set disappearing message.",
      });
    }
  }
);

// ==========================================
// UPDATE INDIVIDUAL MESSAGE STATUS
// ==========================================

router.patch(
  "/:messageId/status",
  async (req, res) => {
    try {
      const {
        messageId,
      } = req.params;

      const {
        status,
      } = req.body;

      if (
        ![
          "sent",
          "delivered",
          "read",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid message status.",
        });
      }

      const message =
        await Message.findByIdAndUpdate(
          messageId,
          {
            status,
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
        "Update message status error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update message status.",
      });
    }
  }
);

// ==========================================
// MARK CONVERSATION MESSAGES DELIVERED
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

      const result =
        await Message.updateMany(
          {
            conversationId,

            receiverId:
              userId,

            status: "sent",

            deletedForReceiver:
              false,

            undone: false,
          },
          {
            $set: {
              status:
                "delivered",
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
// MARK CONVERSATION MESSAGES READ
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

      const result =
        await Message.updateMany(
          {
            conversationId,

            receiverId:
              userId,

            status: {
              $in: [
                "sent",
                "delivered",
              ],
            },

            deletedForReceiver:
              false,

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
      const {
        messageId,
      } = req.params;

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
      const {
        messageId,
      } = req.params;

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
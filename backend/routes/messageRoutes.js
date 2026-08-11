const express = require("express");
const Message = require("../models/Message");

const router = express.Router();

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

router.get("/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required.",
      });
    }

    const messages = await Message.find({
      conversationId,
      $or: [
        {
          deletedForSender: false,
        },
        {
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
      message: "Failed to load messages.",
    });
  }
});

// ==========================================
// SEND MESSAGE
// ==========================================

router.post("/", async (req, res) => {
  try {
    const {
      conversationId,
      senderId,
      receiverId,
      text,
      messageType,
    } = req.body;

    if (
      !conversationId ||
      !senderId ||
      !receiverId ||
      !text ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required message information is missing.",
      });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      receiverId,
      text: text.trim(),
      messageType:
        messageType || "text",
      status: "sent",
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
      message: "Failed to send message.",
      error: error.message,
    });
  }
});

// ==========================================
// DELETE MESSAGE FOR ME
// ==========================================

router.patch(
  "/:messageId/delete-for-me",
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required.",
        });
      }

      const message =
        await Message.findById(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
        });
      }

      if (
        String(message.senderId) ===
        String(userId)
      ) {
        message.deletedForSender = true;
      } else if (
        String(message.receiverId) ===
        String(userId)
      ) {
        message.deletedForReceiver = true;
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
      const { messageId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required.",
        });
      }

      const message =
        await Message.findById(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
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

      message.text =
        "This message was deleted.";

      message.deletedForSender = true;
      message.deletedForReceiver = true;

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
// UPDATE INDIVIDUAL MESSAGE STATUS
// ==========================================

router.patch(
  "/:messageId/status",
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const { status } = req.body;

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
          message: "Message not found.",
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
// MARK CONVERSATION MESSAGES AS DELIVERED
// ==========================================

router.patch(
  "/:conversationId/delivered",
  async (req, res) => {
    try {
      const { conversationId } =
        req.params;

      const { userId } = req.body;

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
// MARK CONVERSATION MESSAGES AS READ
// ==========================================

router.patch(
  "/:conversationId/read",
  async (req, res) => {
    try {
      const { conversationId } =
        req.params;

      const { userId } = req.body;

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
// MARK INDIVIDUAL MESSAGE AS DELIVERED
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
            status: "delivered",
          },
          {
            new: true,
          }
        );

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
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
// MARK INDIVIDUAL MESSAGE AS READ
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
          message: "Message not found.",
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
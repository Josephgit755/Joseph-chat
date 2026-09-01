const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Message = require("../models/Message");

const router = express.Router();

// ==========================================
// MULTER & CLOUDINARY CONFIGURATION
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

const uploadBufferToCloudinary = (buffer, originalName) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "zenvazapp/messages",
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        filename_override: originalName,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });

// ==========================================
// CONSTANTS
// ==========================================

const DELETED_MESSAGE_TEXT = "This message was deleted.";
const UNDONE_MESSAGE_TEXT = "This message was undone.";

const DISAPPEARING_DURATIONS = [
  0,
  24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  90 * 24 * 60 * 60 * 1000,
];

// ==========================================
// HELPERS
// ==========================================

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeUserId = (id) => String(id);

const isParticipant = (message, userId) => {
  const currentUserId = normalizeUserId(userId);

  return (
    normalizeUserId(message.senderId) === currentUserId ||
    normalizeUserId(message.receiverId) === currentUserId
  );
};

// Generates a deterministic room/conversation ID if one is not provided
const getDeterministicConversationId = (idA, idB) => {
  return [String(idA), String(idB)].sort().join("_");
};

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
// MEDIA UPLOAD
// ==========================================

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A media file is required.",
      });
    }

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      req.file.originalname
    );

    return res.status(201).json({
      success: true,
      mediaUrl: result.secure_url,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error("ZenvaZapp media upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload media.",
      error: error.message,
    });
  }
});

// ==========================================
// GET MESSAGES FOR CONVERSATION
// ==========================================

router.get("/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required.",
      });
    }

    const now = new Date();

    await Message.updateMany(
      {
        conversationId,
        expiresAt: {
          $ne: null,
          $lte: now,
        },
        deletedForEveryone: false,
      },
      {
        $set: {
          deletedForSender: true,
          deletedForReceiver: true,
          expiresAt: null,
        },
      }
    );

    const messageQuery = {
      conversationId,
      deletedForEveryone: false,
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
      messageQuery.$or = [
        {
          deletedForSender: false,
        },
        {
          deletedForReceiver: false,
        },
      ];
    }

    const messages = await Message.find(messageQuery)
      .sort({
        createdAt: 1,
      })
      .lean();

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
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
    let {
      conversationId,
      senderId,
      receiverId,
      text,
      messageType,
      mediaUrl,
      disappearingDuration,
    } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "Sender and receiver are required.",
      });
    }

    if (!isValidObjectId(senderId) || !isValidObjectId(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sender or receiver ID.",
      });
    }

    if (!conversationId) {
      conversationId = getDeterministicConversationId(senderId, receiverId);
    }

    const normalizedMessageType = messageType || "text";

    if (
      ![
        "text",
        "image",
        "video",
        "audio",
        "file",
        "voice",
        "system",
      ].includes(normalizedMessageType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid message type.",
      });
    }

    if (
      normalizedMessageType === "text" &&
      (!text || !String(text).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Message text cannot be empty.",
      });
    }

    if (
      normalizedMessageType !== "text" &&
      normalizedMessageType !== "system" &&
      (!mediaUrl || !String(mediaUrl).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Media URL is required for this message type.",
      });
    }

    let duration = 0;

    if (
      disappearingDuration !== undefined &&
      disappearingDuration !== null &&
      disappearingDuration !== "" &&
      disappearingDuration !== "off"
    ) {
      duration = Number(disappearingDuration);
    }

    if (!DISAPPEARING_DURATIONS.includes(duration)) {
      return res.status(400).json({
        success: false,
        message: "Invalid disappearing message duration.",
      });
    }

    let expiresAt = null;

    if (duration > 0) {
      expiresAt = new Date(Date.now() + duration);
    }

    const message = await Message.create({
      conversationId: conversationId.trim(),
      senderId,
      receiverId,
      text: text ? String(text).trim() : "",
      mediaUrl: mediaUrl ? String(mediaUrl).trim() : "",
      messageType: normalizedMessageType,
      status: "sent",
      edited: false,
      deletedForSender: false,
      deletedForReceiver: false,
      deletedForEveryone: false,
      undone: false,
      disappearingDuration: duration,
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message.",
      error: error.message,
    });
  }
});

// ==========================================
// BATCH READ RECEIPT
// ==========================================

router.patch("/read-batch", async (req, res) => {
  try {
    const { conversationId, messageIds, userId } = req.body;

    if (!messageIds || !messageIds.length) {
      return res.status(400).json({ error: "No message IDs provided" });
    }

    await Message.updateMany(
      { _id: { $in: messageIds }, receiverId: userId, status: { $ne: "read" } },
      { $set: { status: "read", readAt: new Date() } }
    );

    res.status(200).json({ success: true, messageIds, conversationId });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

// ==========================================
// EDIT MESSAGE
// ==========================================

router.patch("/:messageId/edit", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, text, content } = req.body;
    const updatedText = text || content;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required.",
      });
    }

    if (!messageId || !isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid message ID is required.",
      });
    }

    if (!updatedText || !String(updatedText).trim()) {
      return res.status(400).json({
        success: false,
        message: "Edited message cannot be empty.",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    if (String(message.senderId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the sender can edit this message.",
      });
    }

    if (
      message.deletedForEveryone ||
      message.deletedForSender ||
      message.undone
    ) {
      return res.status(400).json({
        success: false,
        message: "This message can no longer be edited.",
      });
    }

    message.text = String(updatedText).trim();
    message.edited = true;

    await message.save();

    return res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Edit message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to edit message.",
      error: error.message,
    });
  }
});

// ==========================================
// DELETE MESSAGE FOR ME
// ==========================================

router.patch("/:messageId/delete-for-me", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required.",
      });
    }

    if (!messageId || !isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid message ID is required.",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    if (!isParticipant(message, userId)) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this message.",
      });
    }

    if (String(message.senderId) === String(userId)) {
      message.deletedForSender = true;
    } else {
      message.deletedForReceiver = true;
    }

    await message.save();

    return res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Delete for me error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete message for you.",
    });
  }
});

// ==========================================
// DELETE MESSAGE FOR EVERYONE
// ==========================================

router.patch("/:messageId/delete-for-everyone", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required.",
      });
    }

    if (!messageId || !isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid message ID is required.",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    if (String(message.senderId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the sender can delete this message for everyone.",
      });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({
        success: false,
        message: "Message is already deleted for everyone.",
      });
    }

    message.deletedForEveryone = true;
    message.deletedForSender = true;
    message.deletedForReceiver = true;
    message.expiresAt = null;

    message.mediaUrl = "";
    message.messageType = "text";

    message.text = DELETED_MESSAGE_TEXT;
    await message.save();

    return res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Delete for everyone error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete message for everyone.",
    });
  }
});

// ==========================================
// UNDO MESSAGE
// ==========================================

router.patch("/:messageId/undo", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required.",
      });
    }

    if (!messageId || !isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid message ID is required.",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    if (String(message.senderId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the sender can undo this message.",
      });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({
        success: false,
        message: "A message deleted for everyone cannot be undone.",
      });
    }

    if (message.undone) {
      return res.status(400).json({
        success: false,
        message: "Message has already been undone.",
      });
    }

    message.undone = true;
    message.deletedForSender = true;
    message.deletedForReceiver = true;
    message.expiresAt = null;
    message.text = UNDONE_MESSAGE_TEXT;

    await message.save();

    return res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Undo message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to undo message.",
    });
  }
});

// ==========================================
// DELETE CONVERSATION
// ==========================================

router.delete("/conversation/:conversationId", async (req, res) => {
  const { userId } = req.body;
  try {
    await Message.updateMany(
      { conversationId: req.params.conversationId },
      { $addToSet: { deletedFor: userId } }
    );

    res.json({ message: "Conversation deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error deleting conversation." });
  }
});

router.patch("/conversation/:conversationId/delete", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required.",
      });
    }

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required.",
      });
    }

    const messages = await Message.find({
      conversationId,
    }).select("senderId receiverId");

    if (!messages.length) {
      return res.json({
        success: true,
        message: "Conversation is already empty.",
        deletedCount: 0,
      });
    }

    const participant = messages.some(
      (message) =>
        String(message.senderId) === String(userId) ||
        String(message.receiverId) === String(userId)
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation.",
      });
    }

    const senderResult = await Message.updateMany(
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

    const receiverResult = await Message.updateMany(
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
      Number(senderResult.modifiedCount || 0) +
      Number(receiverResult.modifiedCount || 0);

    return res.json({
      success: true,
      message: "Conversation deleted for you.",
      conversationId,
      deletedCount,
    });
  } catch (error) {
    console.error("Delete conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete conversation.",
      error: error.message,
    });
  }
});

// ==========================================
// MARK INCOMING MESSAGES DELIVERED
// ==========================================

router.patch("/:conversationId/delivered", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required.",
      });
    }

    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        status: "sent",
        deletedForReceiver: false,
        deletedForEveryone: false,
      },
      {
        $set: {
          status: "delivered",
        },
      }
    );

    return res.json({
      success: true,
      message: "Messages marked as delivered.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark conversation messages delivered error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as delivered.",
    });
  }
});

// ==========================================
// MARK INCOMING MESSAGES READ
// ==========================================

router.patch("/:conversationId/read", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required.",
      });
    }

    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        status: {
          $in: ["sent", "delivered"],
        },
        deletedForReceiver: false,
        deletedForEveryone: false,
      },
      {
        $set: {
          status: "read",
        },
      }
    );

    return res.json({
      success: true,
      message: "Messages marked as read.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark conversation messages read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read.",
    });
  }
});

// ==========================================
// MARK INDIVIDUAL MESSAGE DELIVERED
// ==========================================

router.patch("/:messageId/delivered", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required.",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    if (String(message.receiverId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the receiver can mark this message as delivered.",
      });
    }

    if (message.deletedForReceiver || message.deletedForEveryone) {
      return res.status(400).json({
        success: false,
        message: "This message is no longer available.",
      });
    }

    if (message.status === "read") {
      return res.json({
        success: true,
        message,
      });
    }

    message.status = "delivered";

    await message.save();

    return res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Mark message delivered error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark message as delivered.",
    });
  }
});

// ==========================================
// MARK INDIVIDUAL MESSAGE READ
// ==========================================

router.patch("/:messageId/read", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required.",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    if (String(message.receiverId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the receiver can mark this message as read.",
      });
    }

    if (message.deletedForReceiver || message.deletedForEveryone) {
      return res.status(400).json({
        success: false,
        message: "This message is no longer available.",
      });
    }

    message.status = "read";

    await message.save();

    return res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Mark message read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark message as read.",
    });
  }
});

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
const mongoose = require("mongoose");

const StudentNote = require("../models/StudentNote");
const User = require("../models/User");

// ==========================================
// VALIDATE MONGODB OBJECT ID
// ==========================================

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// ==========================================
// GET USER NOTES
// ==========================================

const getUserNotes = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const userExists = await User.exists({
      _id: userId,
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const notes = await StudentNote.find({
      user: userId,
    })
      .sort({
        pinned: -1,
        updatedAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error(
      "Get student notes error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load student notes.",
    });
  }
};

// ==========================================
// CREATE NOTE
// ==========================================

const createNote = async (req, res) => {
  try {
    const {
      userId,
      title,
      content,
      subject,
      color,
      pinned,
    } = req.body;

    // ========================================
    // REQUIRED DATA
    // ========================================

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const trimmedTitle =
      typeof title === "string"
        ? title.trim()
        : "";

    if (!trimmedTitle) {
      return res.status(400).json({
        success: false,
        message: "Note title is required.",
      });
    }

    if (trimmedTitle.length > 200) {
      return res.status(400).json({
        success: false,
        message:
          "Note title cannot exceed 200 characters.",
      });
    }

    // ========================================
    // CHECK USER
    // ========================================

    const userExists = await User.exists({
      _id: userId,
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ========================================
    // CLEAN CONTENT
    // ========================================

    const cleanContent =
      typeof content === "string"
        ? content.trim()
        : "";

    if (cleanContent.length > 50000) {
      return res.status(400).json({
        success: false,
        message:
          "Note content cannot exceed 50,000 characters.",
      });
    }

    const cleanSubject =
      typeof subject === "string"
        ? subject.trim()
        : "";

    const cleanColor =
      typeof color === "string"
        ? color.trim()
        : "purple";

    // ========================================
    // CREATE NOTE
    // ========================================

    const note = await StudentNote.create({
      user: userId,
      title: trimmedTitle,
      content: cleanContent,
      subject: cleanSubject,
      color: cleanColor || "purple",
      pinned:
        typeof pinned === "boolean"
          ? pinned
          : false,
    });

    return res.status(201).json({
      success: true,
      message: "Note created successfully.",
      note,
    });
  } catch (error) {
    console.error(
      "Create student note error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create note.",
    });
  }
};

// ==========================================
// UPDATE NOTE
// ==========================================

const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const {
      userId,
      title,
      content,
      subject,
      color,
      pinned,
    } = req.body;

    if (!noteId) {
      return res.status(400).json({
        success: false,
        message: "Note ID is required.",
      });
    }

    if (!isValidObjectId(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // ========================================
    // FIND NOTE OWNED BY USER
    // ========================================

    const note = await StudentNote.findOne({
      _id: noteId,
      user: userId,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message:
          "Note not found or you do not have permission to edit it.",
      });
    }

    // ========================================
    // UPDATE TITLE
    // ========================================

    if (title !== undefined) {
      if (typeof title !== "string") {
        return res.status(400).json({
          success: false,
          message: "Note title must be text.",
        });
      }

      const trimmedTitle = title.trim();

      if (!trimmedTitle) {
        return res.status(400).json({
          success: false,
          message: "Note title is required.",
        });
      }

      if (trimmedTitle.length > 200) {
        return res.status(400).json({
          success: false,
          message:
            "Note title cannot exceed 200 characters.",
        });
      }

      note.title = trimmedTitle;
    }

    // ========================================
    // UPDATE CONTENT
    // ========================================

    if (content !== undefined) {
      if (typeof content !== "string") {
        return res.status(400).json({
          success: false,
          message:
            "Note content must be text.",
        });
      }

      const trimmedContent = content.trim();

      if (trimmedContent.length > 50000) {
        return res.status(400).json({
          success: false,
          message:
            "Note content cannot exceed 50,000 characters.",
        });
      }

      note.content = trimmedContent;
    }

    // ========================================
    // UPDATE SUBJECT
    // ========================================

    if (subject !== undefined) {
      if (typeof subject !== "string") {
        return res.status(400).json({
          success: false,
          message:
            "Note subject must be text.",
        });
      }

      note.subject = subject.trim();
    }

    // ========================================
    // UPDATE COLOR
    // ========================================

    if (color !== undefined) {
      if (typeof color !== "string") {
        return res.status(400).json({
          success: false,
          message:
            "Note color must be text.",
        });
      }

      note.color =
        color.trim() || "purple";
    }

    // ========================================
    // UPDATE PINNED
    // ========================================

    if (pinned !== undefined) {
      if (typeof pinned !== "boolean") {
        return res.status(400).json({
          success: false,
          message:
            "Pinned value must be true or false.",
        });
      }

      note.pinned = pinned;
    }

    await note.save();

    return res.status(200).json({
      success: true,
      message: "Note updated successfully.",
      note,
    });
  } catch (error) {
    console.error(
      "Update student note error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update note.",
    });
  }
};

// ==========================================
// DELETE NOTE
// ==========================================

const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId } = req.body;

    if (!noteId) {
      return res.status(400).json({
        success: false,
        message: "Note ID is required.",
      });
    }

    if (!isValidObjectId(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const deletedNote =
      await StudentNote.findOneAndDelete({
        _id: noteId,
        user: userId,
      });

    if (!deletedNote) {
      return res.status(404).json({
        success: false,
        message:
          "Note not found or you do not have permission to delete it.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully.",
      noteId,
    });
  } catch (error) {
    console.error(
      "Delete student note error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete note.",
    });
  }
};

module.exports = {
  getUserNotes,
  createNote,
  updateNote,
  deleteNote,
};
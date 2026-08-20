const mongoose = require("mongoose");

const studentNoteSchema = new mongoose.Schema(
  {
    // ==========================================
    // OWNER
    // ==========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // NOTE CONTENT
    // ==========================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    content: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50000,
    },

    // ==========================================
    // OPTIONAL STUDY INFORMATION
    // ==========================================

    subject: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    color: {
      type: String,
      default: "purple",
      trim: true,
      maxlength: 30,
    },

    // ==========================================
    // PINNED NOTE
    // ==========================================

    pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

studentNoteSchema.index({
  user: 1,
  updatedAt: -1,
});

module.exports = mongoose.model(
  "StudentNote",
  studentNoteSchema
);
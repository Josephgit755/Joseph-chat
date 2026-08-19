const mongoose = require("mongoose");

// ==========================================
// STUDENT ROOM MEMBER SCHEMA
// ==========================================

const studentRoomMemberSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      role: {
        type: String,
        enum: [
          "owner",
          "member",
        ],
        default: "member",
      },

      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    }
  );

// ==========================================
// STUDENT ROOM SCHEMA
// ==========================================

const studentRoomSchema =
  new mongoose.Schema(
    {
      // ======================================
      // ROOM INFORMATION
      // ======================================

      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },

      subject: {
        type: String,
        default: "New Student Room",
        trim: true,
        maxlength: 100,
      },

      description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500,
      },

      // ======================================
      // ROOM OWNER
      // ======================================

      owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      // ======================================
      // ROOM MEMBERS
      // ======================================

      members: {
        type: [studentRoomMemberSchema],
        default: [],
      },

      // ======================================
      // INVITATION
      // ======================================

      inviteCode: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
      },

      inviteEnabled: {
        type: Boolean,
        default: true,
      },

      // ======================================
      // ACTIVITY
      // ======================================

      activity: {
        type: String,
        default: "Room created",
        trim: true,
        maxlength: 200,
      },

      // ======================================
      // STATUS
      // ======================================

      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

// ==========================================
// INDEXES
// ==========================================

studentRoomSchema.index({
  owner: 1,
});

studentRoomSchema.index({
  "members.user": 1,
});

studentRoomSchema.index({
  createdAt: -1,
});

// ==========================================
// EXPORT
// ==========================================

module.exports =
  mongoose.model(
    "StudentRoom",
    studentRoomSchema
  );
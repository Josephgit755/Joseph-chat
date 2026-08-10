const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    displayName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },

    gender: {
      type: String,
      enum: [
        "",
        "male",
        "female",
        "other",
        "prefer-not-to-say",
      ],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
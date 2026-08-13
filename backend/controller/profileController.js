const User = require("../models/User");

// ==========================================
// UPDATE USER PROFILE
// ==========================================

const updateProfile = async (req, res) => {
  try {
    // authMiddleware should attach the authenticated
    // user's information to req.user.
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication information is missing.",
      });
    }

    const {
      fullName,
      displayName,
      bio,
      gender,
      profilePhoto,
      profileCompleted,
    } = req.body;

    // ==========================================
    // BUILD UPDATE OBJECT
    // ==========================================

    const updates = {};

    if (fullName !== undefined) {
      updates.fullName = String(fullName).trim();
    }

    if (displayName !== undefined) {
      updates.displayName = String(displayName).trim();
    }

    if (bio !== undefined) {
      updates.bio = String(bio).trim();
    }

    if (gender !== undefined) {
      const allowedGenders = [
        "",
        "male",
        "female",
        "other",
        "prefer-not-to-say",
      ];

      if (!allowedGenders.includes(gender)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender value.",
        });
      }

      updates.gender = gender;
    }

    if (profilePhoto !== undefined) {
      updates.profilePhoto = String(profilePhoto).trim();
    }

    if (profileCompleted !== undefined) {
      updates.profileCompleted =
        Boolean(profileCompleted);
    }

    // ==========================================
    // VALIDATE FULL NAME
    // ==========================================

    if (
      updates.fullName !== undefined &&
      updates.fullName.length < 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Full name must contain at least 2 characters.",
      });
    }

    if (
      updates.fullName !== undefined &&
      updates.fullName.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Full name cannot exceed 100 characters.",
      });
    }

    // ==========================================
    // VALIDATE DISPLAY NAME
    // ==========================================

    if (
      updates.displayName !== undefined &&
      updates.displayName.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Display name cannot exceed 100 characters.",
      });
    }

    // ==========================================
    // VALIDATE BIO
    // ==========================================

    if (
      updates.bio !== undefined &&
      updates.bio.length > 160
    ) {
      return res.status(400).json({
        success: false,
        message: "Bio cannot exceed 160 characters.",
      });
    }

    // ==========================================
    // REQUIRE AT LEAST ONE FIELD
    // ==========================================

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No profile information was provided.",
      });
    }

    // ==========================================
    // UPDATE USER
    // ==========================================

    const updatedUser =
      await User.findByIdAndUpdate(
        userId,
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: error.message,
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  updateProfile,
};
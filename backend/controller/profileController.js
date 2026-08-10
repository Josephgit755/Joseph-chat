const User = require("../models/User");

const updateProfile = async (req, res) => {
  try {
    const {
      displayName,
      bio,
      gender,
      profilePhoto,
    } = req.body;

    // --------------------------------
    // 1. Validate display name
    // --------------------------------
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Display name is required.",
      });
    }

    // --------------------------------
    // 2. Validate display name length
    // --------------------------------
    const cleanedDisplayName =
      displayName.trim();

    if (cleanedDisplayName.length > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Display name cannot exceed 100 characters.",
      });
    }

    // --------------------------------
    // 3. Validate bio
    // --------------------------------
    const cleanedBio = bio
      ? bio.trim()
      : "";

    if (cleanedBio.length > 160) {
      return res.status(400).json({
        success: false,
        message:
          "Bio cannot exceed 160 characters.",
      });
    }

    // --------------------------------
    // 4. Validate gender
    // --------------------------------
    const allowedGenders = [
      "male",
      "female",
      "other",
      "prefer-not-to-say",
    ];

    if (!allowedGenders.includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid gender.",
      });
    }

    // --------------------------------
    // 5. Find authenticated user
    // --------------------------------
    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // --------------------------------
    // 6. Update profile
    // --------------------------------
    user.displayName =
      cleanedDisplayName;

    user.bio = cleanedBio;

    user.gender = gender;

    if (profilePhoto) {
      user.profilePhoto =
        profilePhoto;
    }

    // --------------------------------
    // 7. Mark profile complete
    // --------------------------------
    user.profileCompleted = true;

    await user.save();

    // --------------------------------
    // 8. Return safe response
    // --------------------------------
    return res.status(200).json({
      success: true,
      message: "Profile completed successfully.",

      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        profileCompleted:
          user.profileCompleted,
        profilePhoto:
          user.profilePhoto,
        displayName:
          user.displayName,
        bio: user.bio,
        gender: user.gender,
      },
    });
  } catch (error) {
    console.error(
      "Profile update error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating profile.",
    });
  }
};

module.exports = {
  updateProfile,
};
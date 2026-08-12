const User = require("../models/User");

// ==========================================
// GET REGISTERED USERS
// ==========================================

const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "_id fullName username profilePhoto displayName bio profileCompleted"
      )
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      users: users.map((user) => ({
        id: user._id.toString(),
        fullName: user.fullName,
        username: user.username,
        profilePhoto: user.profilePhoto,
        displayName: user.displayName,
        bio: user.bio,
        profileCompleted: user.profileCompleted,
      })),
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading users.",
    });
  }
};

module.exports = {
  getUsers,
};
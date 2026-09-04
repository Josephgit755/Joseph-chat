const User = require("../models/User");

const requirePremium = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    const now = new Date();

    const active =
      user.plan === "zenva-premium" &&
      user.premiumStatus === "active" &&
      user.premiumEndDate &&
      user.premiumEndDate > now;

    if (!active) {
      return res.status(403).json({
        success: false,
        premiumRequired: true,
        message:
          "Zenva Premium is required for this feature.",
      });
    }

    req.premiumUser = user;

    next();
  } catch (error) {
    console.error(
      "Premium middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify Premium status.",
    });
  }
};

module.exports = requirePremium;
const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  updateProfile,
  deleteAccount,
} = require("../controller/profileController");

const router = express.Router();

// ==========================================
// UPDATE PROFILE
// ==========================================

router.put(
  "/",
  protect,
  updateProfile
);

// ==========================================
// DELETE ACCOUNT
// ==========================================

router.delete(
  "/",
  protect,
  deleteAccount
);

module.exports = router;
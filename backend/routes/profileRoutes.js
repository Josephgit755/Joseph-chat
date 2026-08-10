const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  updateProfile,
} = require("../controller/profileController");

const router = express.Router();

router.put(
  "/",
  protect,
  updateProfile
);

module.exports = router;
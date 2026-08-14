const express = require("express");

const {
  registerUser,
  loginUser,
  verifyLoginOTP,
  resendLoginOTP,
} = require("../controller/authController");

const router = express.Router();

// Registration
router.post(
  "/register",
  registerUser
);

// Login
router.post(
  "/login",
  loginUser
);

// Verify login OTP
router.post(
  "/verify-otp",
  verifyLoginOTP
);

// Resend login OTP
router.post(
  "/resend-otp",
  resendLoginOTP
);

module.exports = router;
const express = require("express");

const {
  registerUser,
  loginUser,
  verifyLoginOTP,
  resendLoginOTP,
} = require("../controller/authController");

const router = express.Router();

// ==========================================
// REGISTER
// ==========================================

router.post(
  "/register",
  registerUser
);

// ==========================================
// LOGIN
// ==========================================

router.post(
  "/login",
  loginUser
);

// ==========================================
// VERIFY LOGIN OTP
// ==========================================

router.post(
  "/verify-otp",
  verifyLoginOTP
);

// ==========================================
// RESEND LOGIN OTP
// ==========================================

router.post(
  "/resend-otp",
  resendLoginOTP
);

module.exports = router;
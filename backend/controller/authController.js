const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const sendOTPEmail = require("../utils/sendOTPEmail");

// ==========================================
// OTP SETTINGS
// ==========================================

const OTP_EXPIRATION_MINUTES = 10;

const generateOTP = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
};

// ==========================================
// REGISTER USER
// ==========================================

const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      phone,
      password,
      confirmPassword,
    } = req.body;

    // 1. Required fields
    if (
      !fullName ||
      !username ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // 2. Clean information
    const cleanedFullName =
      fullName.trim();

    const cleanedUsername =
      username
        .trim()
        .replace(/^@/, "")
        .toLowerCase();

    const cleanedEmail =
      email.trim().toLowerCase();

    const cleanedPhone =
      phone
        .trim()
        .replace(/[\s()-]/g, "");

    // 3. Full name validation
    const nameParts =
      cleanedFullName.split(/\s+/);

    const fullNameRegex =
      /^[A-Za-zÀ-ÿ' -]+$/;

    if (
      nameParts.length < 2 ||
      !fullNameRegex.test(cleanedFullName)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter your full name using at least two names.",
      });
    }

    // 4. Username validation
    const usernameRegex =
      /^[a-zA-Z0-9_]{3,30}$/;

    if (
      !usernameRegex.test(
        cleanedUsername
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be 3-30 characters and can only contain letters, numbers, and underscores.",
      });
    }

    // 5. Email validation
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(cleanedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    // 6. Phone validation
    const phoneRegex =
      /^\+?[1-9]\d{7,14}$/;

    if (
      !phoneRegex.test(cleanedPhone)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid phone number.",
      });
    }

    // 7. Password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    // 8. Password validation
    const passwordRules = {
      minLength:
        password.length >= 8,

      uppercase:
        /[A-Z]/.test(password),

      lowercase:
        /[a-z]/.test(password),

      number:
        /[0-9]/.test(password),

      special:
        /[^A-Za-z0-9]/.test(password),
    };

    const passwordIsValid =
      passwordRules.minLength &&
      passwordRules.uppercase &&
      passwordRules.lowercase &&
      passwordRules.number &&
      passwordRules.special;

    if (!passwordIsValid) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    // 9. Username check
    const existingUsername =
      await User.findOne({
        username: cleanedUsername,
      });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message:
          "Username is already taken.",
      });
    }

    // 10. Email check
    const existingEmail =
      await User.findOne({
        email: cleanedEmail,
      });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message:
          "Email is already registered.",
      });
    }

    // 11. Phone check
    const existingPhone =
      await User.findOne({
        phone: cleanedPhone,
      });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "Phone number is already registered.",
      });
    }

    // 12. Hash password
    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    // 13. Create user
    const user =
      await User.create({
        fullName:
          cleanedFullName,

        username:
          cleanedUsername,

        email:
          cleanedEmail,

        phone:
          cleanedPhone,

        password:
          hashedPassword,
      });

    // 14. Safe response
    return res.status(201).json({
      success: true,
      message:
        "Account created successfully.",

      user: {
        id: user._id,
        fullName:
          user.fullName,
        username:
          user.username,
        email:
          user.email,
        phone:
          user.phone,
        profileCompleted:
          user.profileCompleted,
      },
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error during registration.",
    });
  }
};

// ==========================================
// LOGIN USER
// ==========================================

const loginUser = async (req, res) => {
  try {
    const {
      identifier,
      password,
    } = req.body;

    // 1. Check fields
    if (
      !identifier ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email, username, or phone and password are required.",
      });
    }

    const cleanedIdentifier =
      identifier
        .trim()
        .toLowerCase();

    const cleanedPhone =
      identifier
        .trim()
        .replace(/[\s()-]/g, "");

    // 2. Find user
    const user =
      await User.findOne({
        $or: [
          {
            email:
              cleanedIdentifier,
          },
          {
            username:
              cleanedIdentifier,
          },
          {
            phone:
              cleanedPhone,
          },
        ],
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid login credentials.",
      });
    }

    // 3. Check password
    const passwordIsCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordIsCorrect) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid login credentials.",
      });
    }

    // ======================================
    // 4. GENERATE OTP
    // ======================================

    const otp =
      generateOTP();

    const otpExpiresAt =
      new Date(
        Date.now() +
          OTP_EXPIRATION_MINUTES *
            60 *
            1000
      );

    // ======================================
    // 5. SAVE OTP
    // ======================================

    user.loginOTP = otp;

    user.loginOTPExpiresAt =
      otpExpiresAt;

    await user.save();

    // ======================================
    // 6. SEND OTP TO GMAIL
    // ======================================

    try {
      await sendOTPEmail({
        email: user.email,
        fullName:
          user.fullName,
        otp,
      });
    } catch (emailError) {
      console.error(
        "OTP email error:",
        emailError
      );

      // Clear OTP if email failed
      user.loginOTP = "";
      user.loginOTPExpiresAt =
        null;

      await user.save();

      return res.status(500).json({
        success: false,
        message:
          "Unable to send the verification code to your email.",
      });
    }

    // ======================================
    // 7. LOGIN ACCEPTED, OTP REQUIRED
    // ======================================

    return res.status(200).json({
      success: true,
      requiresOTP: true,
      message:
        "Login credentials accepted. Verification code sent to your email.",

      destination:
        user.email,

      user: {
        id: user._id,
        fullName:
          user.fullName,
        username:
          user.username,
        email:
          user.email,
        phone:
          user.phone,
        profileCompleted:
          user.profileCompleted,
        profilePhoto:
          user.profilePhoto,
        displayName:
          user.displayName,
        bio:
          user.bio,
        gender:
          user.gender,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error during login.",
    });
  }
};

// ==========================================
// VERIFY LOGIN OTP
// ==========================================

const verifyLoginOTP = async (
  req,
  res
) => {
  try {
    const {
      userId,
      otp,
    } = req.body;

    // 1. Check fields
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "User ID and OTP are required.",
      });
    }

    const cleanedOTP =
      String(otp)
        .replace(/\D/g, "")
        .slice(0, 6);

    if (
      cleanedOTP.length !== 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 6-digit OTP.",
      });
    }

    // 2. Find user
    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account not found.",
      });
    }

    // 3. Check OTP exists
    if (!user.loginOTP) {
      return res.status(400).json({
        success: false,
        message:
          "No active verification code. Please request a new OTP.",
      });
    }

    // 4. Check expiration
    if (
      !user.loginOTPExpiresAt ||
      new Date() >
        new Date(
          user.loginOTPExpiresAt
        )
    ) {
      user.loginOTP = "";
      user.loginOTPExpiresAt =
        null;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "Your OTP has expired. Please request a new one.",
      });
    }

    // 5. Check OTP
    if (
      cleanedOTP !==
      user.loginOTP
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Incorrect verification code.",
      });
    }

    // ======================================
    // 6. OTP VERIFIED
    // ======================================

    user.loginOTP = "";

    user.loginOTPExpiresAt =
      null;

    user.lastOTPVerifiedAt =
      new Date();

    await user.save();

    // ======================================
    // 7. CREATE JWT AFTER OTP
    // ======================================

    const token =
      jwt.sign(
        {
          id:
            user._id.toString(),
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

    // ======================================
    // 8. SEND AUTHENTICATED RESPONSE
    // ======================================

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully. Login complete.",

      token,

      user: {
        id: user._id,
        fullName:
          user.fullName,
        username:
          user.username,
        email:
          user.email,
        phone:
          user.phone,
        profileCompleted:
          user.profileCompleted,
        profilePhoto:
          user.profilePhoto,
        displayName:
          user.displayName,
        bio:
          user.bio,
        gender:
          user.gender,
      },
    });
  } catch (error) {
    console.error(
      "OTP verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error during OTP verification.",
    });
  }
};

// ==========================================
// RESEND LOGIN OTP
// ==========================================

const resendLoginOTP = async (
  req,
  res
) => {
  try {
    const {
      userId,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account not found.",
      });
    }

    // ======================================
    // GENERATE NEW OTP
    // ======================================

    const otp =
      generateOTP();

    const otpExpiresAt =
      new Date(
        Date.now() +
          OTP_EXPIRATION_MINUTES *
            60 *
            1000
      );

    user.loginOTP = otp;

    user.loginOTPExpiresAt =
      otpExpiresAt;

    await user.save();

    // ======================================
    // SEND NEW OTP
    // ======================================

    try {
      await sendOTPEmail({
        email: user.email,
        fullName:
          user.fullName,
        otp,
      });
    } catch (emailError) {
      console.error(
        "Resend OTP email error:",
        emailError
      );

      user.loginOTP = "";
      user.loginOTPExpiresAt =
        null;

      await user.save();

      return res.status(500).json({
        success: false,
        message:
          "Unable to resend the verification code.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "A new verification code has been sent to your email.",
      destination:
        user.email,
    });
  } catch (error) {
    console.error(
      "Resend OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while resending OTP.",
    });
  }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  registerUser,
  loginUser,
  verifyLoginOTP,
  resendLoginOTP,
};
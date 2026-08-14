const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const sendOTPEmail = require("../utils/sendOTPEmail");

// ==========================================
// OTP SETTINGS
// ==========================================

const OTP_EXPIRATION_MINUTES = Number(
  process.env.OTP_EXPIRES_MINUTES || 5
);

const OTP_MAX_ATTEMPTS = 5;

const OTP_RESEND_COOLDOWN_SECONDS = 60;

// ==========================================
// GENERATE OTP
// ==========================================

const generateOTP = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
};

// ==========================================
// HASH OTP
// ==========================================

const hashOTP = (otp) => {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
};

// ==========================================
// SAFE USER
// ==========================================

const getSafeUser = (user) => {
  return {
    id: user._id,

    fullName: user.fullName,

    username: user.username,

    email: user.email,

    phone: user.phone,

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
  };
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

    // ==========================================
    // REQUIRED FIELDS
    // ==========================================

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

    // ==========================================
    // CLEAN INFORMATION
    // ==========================================

    const cleanedFullName =
      fullName.trim();

    const cleanedUsername =
      username
        .trim()
        .replace(/^@/, "")
        .toLowerCase();

    const cleanedEmail =
      email
        .trim()
        .toLowerCase();

    const cleanedPhone =
      phone
        .trim()
        .replace(/[\s()-]/g, "");

    // ==========================================
    // FULL NAME
    // ==========================================

    const nameParts =
      cleanedFullName.split(/\s+/);

    const fullNameRegex =
      /^[A-Za-zÀ-ÿ' -]+$/;

    if (
      nameParts.length < 2 ||
      !fullNameRegex.test(
        cleanedFullName
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter your full name using at least two names.",
      });
    }

    // ==========================================
    // USERNAME
    // ==========================================

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

    // ==========================================
    // EMAIL
    // ==========================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        cleanedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    // ==========================================
    // PHONE
    // ==========================================

    const phoneRegex =
      /^\+?[1-9]\d{7,14}$/;

    if (
      !phoneRegex.test(
        cleanedPhone
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid phone number.",
      });
    }

    // ==========================================
    // PASSWORD CONFIRMATION
    // ==========================================

    if (
      password !==
      confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    // ==========================================
    // PASSWORD RULES
    // ==========================================

    const passwordIsValid =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!passwordIsValid) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    // ==========================================
    // EXISTING USERNAME
    // ==========================================

    const existingUsername =
      await User.findOne({
        username:
          cleanedUsername,
      });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message:
          "Username is already taken.",
      });
    }

    // ==========================================
    // EXISTING EMAIL
    // ==========================================

    const existingEmail =
      await User.findOne({
        email:
          cleanedEmail,
      });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message:
          "Email is already registered.",
      });
    }

    // ==========================================
    // EXISTING PHONE
    // ==========================================

    const existingPhone =
      await User.findOne({
        phone:
          cleanedPhone,
      });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "Phone number is already registered.",
      });
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    // ==========================================
    // CREATE USER
    // ==========================================

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

    return res.status(201).json({
      success: true,

      message:
        "Account created successfully.",

      user:
        getSafeUser(user),
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
        .replace(
          /[\s()-]/g,
          ""
        );

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

    // ==========================================
    // CHECK PASSWORD
    // ==========================================

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

    // ==========================================
    // GENERATE OTP
    // ==========================================

    const otp =
      generateOTP();

    const hashedOTP =
      hashOTP(otp);

    const otpExpiresAt =
      new Date(
        Date.now() +
          OTP_EXPIRATION_MINUTES *
            60 *
            1000
      );

    // ==========================================
    // SAVE OTP
    // ==========================================

    user.loginOTP =
      hashedOTP;

    user.loginOTPExpiresAt =
      otpExpiresAt;

    user.otpAttempts = 0;

    user.lastOTPRequestedAt =
      new Date();

    await user.save();

    // ==========================================
    // SEND OTP EMAIL
    // ==========================================

    try {
      await sendOTPEmail({
        email:
          user.email,

        fullName:
          user.fullName,

        otp,
      });
    } catch (emailError) {
      console.error(
        "OTP email error:",
        emailError
      );

      user.loginOTP = "";

      user.loginOTPExpiresAt =
        null;

      user.otpAttempts = 0;

      user.lastOTPRequestedAt =
        null;

      await user.save();

      return res.status(500).json({
        success: false,
        message:
          "Unable to send the verification code to your email.",
      });
    }

    // ==========================================
    // OTP REQUIRED
    // ==========================================

    return res.status(200).json({
      success: true,

      requiresOTP: true,

      message:
        "Login credentials accepted. A verification code has been sent to your email.",

      destination:
        user.email,

      user:
        getSafeUser(user),
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

    if (
      !userId ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User ID and OTP are required.",
      });
    }

    // ==========================================
    // CLEAN OTP
    // ==========================================

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

    // ==========================================
    // FIND USER
    // ==========================================

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

    // ==========================================
    // NO ACTIVE OTP
    // ==========================================

    if (!user.loginOTP) {
      return res.status(400).json({
        success: false,
        message:
          "No active verification code. Please request a new OTP.",
      });
    }

    // ==========================================
    // MAX ATTEMPTS
    // ==========================================

    if (
      user.otpAttempts >=
      OTP_MAX_ATTEMPTS
    ) {
      user.loginOTP = "";

      user.loginOTPExpiresAt =
        null;

      user.otpAttempts = 0;

      await user.save();

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // ==========================================
    // CHECK EXPIRATION
    // ==========================================

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

      user.otpAttempts = 0;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "Your OTP has expired. Please request a new one.",
      });
    }

    // ==========================================
    // COMPARE OTP
    // ==========================================

    const submittedHash =
      hashOTP(cleanedOTP);

    if (
      submittedHash !==
      user.loginOTP
    ) {
      user.otpAttempts += 1;

      await user.save();

      const remainingAttempts =
        Math.max(
          0,
          OTP_MAX_ATTEMPTS -
            user.otpAttempts
        );

      return res.status(401).json({
        success: false,
        message:
          remainingAttempts > 0
            ? `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`
            : "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // ==========================================
    // OTP VERIFIED
    // ==========================================

    user.loginOTP = "";

    user.loginOTPExpiresAt =
      null;

    user.otpAttempts = 0;

    user.lastOTPVerifiedAt =
      new Date();

    await user.save();

    // ==========================================
    // CREATE JWT
    // ==========================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration is missing.",
      });
    }

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

    // ==========================================
    // LOGIN COMPLETE
    // ==========================================

    return res.status(200).json({
      success: true,

      message:
        "OTP verified successfully. Login complete.",

      token,

      user:
        getSafeUser(user),
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

    // ==========================================
    // FIND USER
    // ==========================================

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

    // ==========================================
    // RESEND COOLDOWN
    // ==========================================

    if (
      user.lastOTPRequestedAt
    ) {
      const secondsSinceLastRequest =
        Math.floor(
          (Date.now() -
            new Date(
              user.lastOTPRequestedAt
            ).getTime()) /
            1000
        );

      if (
        secondsSinceLastRequest <
        OTP_RESEND_COOLDOWN_SECONDS
      ) {
        const remaining =
          OTP_RESEND_COOLDOWN_SECONDS -
          secondsSinceLastRequest;

        return res.status(429).json({
          success: false,

          message:
            `Please wait ${remaining} seconds before requesting another OTP.`,

          retryAfter:
            remaining,
        });
      }
    }

    // ==========================================
    // GENERATE NEW OTP
    // ==========================================

    const otp =
      generateOTP();

    const hashedOTP =
      hashOTP(otp);

    const otpExpiresAt =
      new Date(
        Date.now() +
          OTP_EXPIRATION_MINUTES *
            60 *
            1000
      );

    user.loginOTP =
      hashedOTP;

    user.loginOTPExpiresAt =
      otpExpiresAt;

    user.otpAttempts = 0;

    user.lastOTPRequestedAt =
      new Date();

    await user.save();

    // ==========================================
    // SEND NEW OTP
    // ==========================================

    try {
      await sendOTPEmail({
        email:
          user.email,

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

      user.otpAttempts = 0;

      user.lastOTPRequestedAt =
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

      expiresIn:
        OTP_EXPIRATION_MINUTES,
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
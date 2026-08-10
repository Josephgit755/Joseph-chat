const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

    // 1. Check required fields
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
    const cleanedFullName = fullName.trim();

    const cleanedUsername = username
      .trim()
      .replace(/^@/, "")
      .toLowerCase();

    const cleanedEmail = email
      .trim()
      .toLowerCase();

    const cleanedPhone = phone
      .trim()
      .replace(/[\s()-]/g, "");

    // 3. Validate full name
    const nameParts = cleanedFullName.split(/\s+/);
    const fullNameRegex = /^[A-Za-zÀ-ÿ' -]+$/;

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

    // 4. Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

    if (!usernameRegex.test(cleanedUsername)) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be 3-30 characters and can only contain letters, numbers, and underscores.",
      });
    }

    // 5. Validate email
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanedEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    // 6. Validate phone
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;

    if (!phoneRegex.test(cleanedPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid phone number.",
      });
    }

    // 7. Check password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    // 8. Validate password
    const passwordRules = {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
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

    // 9. Check username
    const existingUsername = await User.findOne({
      username: cleanedUsername,
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken.",
      });
    }

    // 10. Check email
    const existingEmail = await User.findOne({
      email: cleanedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    // 11. Check phone
    const existingPhone = await User.findOne({
      phone: cleanedPhone,
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "Phone number is already registered.",
      });
    }

    // 12. Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    // 13. Create user
    const user = await User.create({
      fullName: cleanedFullName,
      username: cleanedUsername,
      email: cleanedEmail,
      phone: cleanedPhone,
      password: hashedPassword,
    });

    // 14. Return safe response
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",

      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profileCompleted: user.profileCompleted,
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
    const { identifier, password } = req.body;

    // 1. Check fields
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email, username, or phone and password are required.",
      });
    }

    const cleanedIdentifier =
      identifier.trim().toLowerCase();

    // 2. Find user
    const user = await User.findOne({
      $or: [
        {
          email: cleanedIdentifier,
        },
        {
          username: cleanedIdentifier,
        },
        {
          phone: identifier.trim(),
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials.",
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
        message: "Invalid login credentials.",
      });
    }

    // 4. Create JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // 5. Send login response
    return res.status(200).json({
      success: true,
      message: "Login successful.",

      token,

      user: {
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
        bio: user.bio,
        gender: user.gender,
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
// EXPORT FUNCTIONS
// ==========================================

module.exports = {
  registerUser,
  loginUser,
};
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const translatorRoutes = require("./routes/translatorRoutes");

dotenv.config();

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ZenvaZapp API is running",
  });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

// ==========================================
// PROFILE ROUTES
// ==========================================

app.use(
  "/api/profile",
  profileRoutes
);

// ==========================================
// MESSAGE ROUTES
// ==========================================

app.use(
  "/api/messages",
  messageRoutes
);

// ==========================================
// USER ROUTES
// ==========================================

app.use(
  "/api/users",
  userRoutes
);

// ==========================================
// CONTACT ROUTES
// ==========================================

app.use(
  "/api/contacts",
  contactRoutes
);

// ==========================================
// TRANSLATOR ROUTES
// ==========================================
//
// POST /api/translator/translate
//
// Body:
//
// {
//   "text": "Hello",
//   "sourceLanguage": "english",
//   "targetLanguage": "french"
// }
//
// ==========================================

app.use(
  "/api/translator",
  translatorRoutes
);

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ==========================================
// EXPORT APP
// ==========================================

module.exports = app;
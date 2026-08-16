const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");

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
//
// Contacts are now becoming their own
// persistent MongoDB system instead of
// relying directly on /api/users.
//
// Available endpoints:
//
// GET    /api/contacts
// GET    /api/contacts/search?q=...
// POST   /api/contacts
// GET    /api/contacts/:contactId
// DELETE /api/contacts/:contactId
// PATCH  /api/contacts/:contactId/favorite
// ==========================================

app.use(
  "/api/contacts",
  contactRoutes
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
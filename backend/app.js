const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const translatorRoutes = require("./routes/translatorRoutes");
const studentRoomRoutes = require("./routes/studentRoomRoutes");
const studentNoteRoutes = require("./routes/studentNoteRoutes");

dotenv.config();

const app = express();

// ==========================================
// MIDDLEWARE & PARSERS
// ==========================================

app.use(cors({
  origin: "*",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
// ROUTE MOUNTING
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/translator", translatorRoutes);
app.use("/api/student-rooms", studentRoomRoutes);
app.use("/api/student-notes", studentNoteRoutes);

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

module.exports = app;
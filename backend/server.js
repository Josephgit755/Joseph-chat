const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const messageRoutes = require("./routes/messageRoutes");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

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

app.use("/api/auth", authRoutes);

// ==========================================
// PROFILE ROUTES
// ==========================================

app.use("/api/profile", profileRoutes);

// ==========================================
// MESSAGE ROUTES
// ==========================================

app.use("/api/messages", messageRoutes);

// ==========================================
// MESSAGE TEST ROUTE
// ==========================================

app.get("/api/messages/test", (req, res) => {
  res.json({
    success: true,
    message: "ZenvaZapp message API is working",
  });
});

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// CONNECT TO MONGODB
// ==========================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully.");
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });

// ==========================================
// START SERVER
// ==========================================

const server = app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `ZenvaZapp server running on port ${PORT}`
    );
  }
);

// ==========================================
// SHUTDOWN
// ==========================================

process.on("SIGINT", () => {
  console.log(
    "Shutting down ZenvaZapp server..."
  );

  server.close(() => {
    mongoose.connection.close();

    process.exit(0);
  });
});
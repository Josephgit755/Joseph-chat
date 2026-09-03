const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Match exact casing and file names in your routes directory:
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const messageRoutes = require("./routes/messageRoutes"); // <--- Ensure this matches the exact filename in /routes
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const translatorRoutes = require("./routes/translatorRoutes");
const studentRoomRoutes = require("./routes/studentRoomRoutes");
const studentNoteRoutes = require("./routes/studentNoteRoutes");
const businessRoutes = require("./routes/businessRoutes");
const businessProductRoutes = require("./routes/businessProductRoutes");
const businessPostRoutes = require("./routes/businessPostRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const businessMessageRoutes = require("./routes/businessMessageRoutes");

dotenv.config();

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors({
  origin: "*",
  credentials: true,
}));

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
// BUSINESS ROUTES
// ==========================================
//
// GET
// /api/business/user/:userId
//
// POST
// /api/business
//
// PATCH
// /api/business/:businessId
//
// ==========================================

app.use(
  "/api/businesses",
  businessRoutes
);
app.use(
  "/api/business-products",
  businessProductRoutes
);

app.use(
  "/api/business-posts",
  businessPostRoutes
);
app.use(
  "/api/payments",
  paymentRoutes
);
app.use(
 "/api/products",
 productRoutes
);
app.use(
 "/api/orders",
 orderRoutes
);
app.use(
 "/api/subscriptions",
 subscriptionRoutes
);
app.use(
  "/api/business-messages",
  businessMessageRoutes
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

module.exports = app;
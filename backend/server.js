const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const app = require("./app");

dotenv.config();

const PORT = process.env.PORT || 5000;

// ==========================================
// CREATE HTTP SERVER
// ==========================================

const server = http.createServer(app);

// ==========================================
// SOCKET.IO
// ==========================================

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

// ==========================================
// SOCKET.IO CONNECTION
// ==========================================

io.on("connection", (socket) => {
  console.log(
    `ZenvaZapp Socket.IO user connected: ${socket.id}`
  );

  // ========================================
  // JOIN CONVERSATION
  // ========================================

  socket.on(
    "join-conversation",
    (conversationId) => {
      if (!conversationId) {
        console.log(
          "Join conversation rejected: conversationId missing."
        );

        return;
      }

      socket.join(conversationId);

      console.log(
        `Socket ${socket.id} joined conversation: ${conversationId}`
      );
    }
  );

  // ========================================
  // LEAVE CONVERSATION
  // ========================================

  socket.on(
    "leave-conversation",
    (conversationId) => {
      if (!conversationId) {
        return;
      }

      socket.leave(conversationId);

      console.log(
        `Socket ${socket.id} left conversation: ${conversationId}`
      );
    }
  );

  // ========================================
  // REAL-TIME MESSAGE
  // ========================================

  socket.on("send-message", (message) => {
    if (!message) {
      return;
    }

    const conversationId =
      message.conversationId;

    if (!conversationId) {
      console.log(
        "Socket message rejected: conversationId missing."
      );

      return;
    }

    console.log(
      "Real-time message received:",
      message
    );

    // Send message to OTHER users in the conversation.
    // The sender already added the saved message locally.
    socket
      .to(conversationId)
      .emit(
        "new-message",
        message
      );
  });

  // ========================================
  // MESSAGE DELIVERED
  // ========================================

  socket.on(
    "message-delivered",
    ({
      conversationId,
      messageId,
    }) => {
      if (
        !conversationId ||
        !messageId
      ) {
        return;
      }

      console.log(
        `Message delivered: ${messageId}`
      );

      socket
        .to(conversationId)
        .emit(
          "message-delivered",
          {
            messageId,
          }
        );
    }
  );

  // ========================================
  // MESSAGE READ
  // ========================================

  socket.on(
    "message-read",
    ({
      conversationId,
      messageId,
    }) => {
      if (
        !conversationId ||
        !messageId
      ) {
        return;
      }

      console.log(
        `Message read: ${messageId}`
      );

      socket
        .to(conversationId)
        .emit(
          "message-read",
          {
            messageId,
          }
        );
    }
  );

  // ========================================
  // DISCONNECT
  // ========================================

  socket.on("disconnect", () => {
    console.log(
      `ZenvaZapp Socket.IO user disconnected: ${socket.id}`
    );
  });
});

// ==========================================
// START SERVER
// ==========================================

server.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `ZenvaZapp server running on port ${PORT}`
    );
  }
);

// ==========================================
// CONNECT TO MONGODB
// ==========================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(
      "MongoDB connected successfully."
    );
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });

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
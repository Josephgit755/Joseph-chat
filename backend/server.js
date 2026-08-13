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
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

app.set("io", io);

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
  // REAL-TIME NEW MESSAGE
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

    // The sender already added the saved message
    // locally, so only send it to the other users.
    socket
      .to(conversationId)
      .emit(
        "new-message",
        message
      );
  });

  // ========================================
  // MESSAGE EDITED
  // ========================================

  socket.on(
    "message-edited",
    (message) => {
      if (!message) {
        return;
      }

      const conversationId =
        message.conversationId;

      if (!conversationId) {
        console.log(
          "Edited message rejected: conversationId missing."
        );

        return;
      }

      if (!message._id && !message.id) {
        console.log(
          "Edited message rejected: message ID missing."
        );

        return;
      }

      console.log(
        `Message edited: ${
          message._id || message.id
        }`
      );

      // Send the updated message to the
      // OTHER browsers in this conversation.
      socket
        .to(conversationId)
        .emit(
          "message-edited",
          message
        );
    }
  );

  // ========================================
  // MESSAGE DELETED FOR EVERYONE
  // ========================================

  socket.on(
    "message-deleted-for-everyone",
    (message) => {
      if (!message) {
        return;
      }

      const conversationId =
        message.conversationId;

      if (!conversationId) {
        console.log(
          "Delete-for-everyone rejected: conversationId missing."
        );

        return;
      }

      if (!message._id && !message.id) {
        console.log(
          "Delete-for-everyone rejected: message ID missing."
        );

        return;
      }

      console.log(
        `Message deleted for everyone: ${
          message._id || message.id
        }`
      );

      // Both browsers must display the deleted
      // state. The requesting browser updates
      // itself locally, while this broadcasts
      // the change to the other browser(s).
      socket
        .to(conversationId)
        .emit(
          "message-deleted-for-everyone",
          message
        );
    }
  );

  // ========================================
  // MESSAGE DELETED FOR ME
  // ========================================

  socket.on(
    "message-deleted-for-me",
    (message) => {
      if (!message) {
        return;
      }

      const conversationId =
        message.conversationId;

      if (!conversationId) {
        return;
      }

      if (!message._id && !message.id) {
        return;
      }

      console.log(
        `Message deleted for one user: ${
          message._id || message.id
        }`
      );

      /*
        IMPORTANT:

        Delete-for-me should normally NOT remove
        the message from the other user's browser.

        Therefore we do NOT broadcast this event
        as a deletion to the other participant.

        The requesting browser handles its own
        local deletion.
      */
    }
  );

  // ========================================
  // MESSAGE UNDONE
  // ========================================

  socket.on(
    "message-undone",
    (message) => {
      if (!message) {
        return;
      }

      const conversationId =
        message.conversationId;

      if (!conversationId) {
        console.log(
          "Undo rejected: conversationId missing."
        );

        return;
      }

      if (!message._id && !message.id) {
        console.log(
          "Undo rejected: message ID missing."
        );

        return;
      }

      console.log(
        `Message undone: ${
          message._id || message.id
        }`
      );

      // Tell the other browser about the undo.
      socket
        .to(conversationId)
        .emit(
          "message-undone",
          message
        );
    }
  );

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
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
    methods: [
      "GET",
      "POST",
      "PATCH",
      "DELETE",
    ],
  },
});

app.set("io", io);

// ==========================================
// CONNECTED USER SOCKET MAP
// ==========================================
//
// userId -> Set of socket IDs
//
// A user can have more than one browser/device
// connected at the same time.
//

const connectedUsers = new Map();

// ==========================================
// USER ROOM HELPER
// ==========================================

const getUserRoom = (userId) => {
  if (!userId) {
    return null;
  }

  return `user:${String(userId)}`;
};

// ==========================================
// ADD USER SOCKET
// ==========================================

const registerUserSocket = (
  userId,
  socket
) => {
  if (!userId || !socket) {
    return;
  }

  const normalizedUserId =
    String(userId);

  const existingSockets =
    connectedUsers.get(
      normalizedUserId
    ) || new Set();

  existingSockets.add(
    socket.id
  );

  connectedUsers.set(
    normalizedUserId,
    existingSockets
  );

  const userRoom =
    getUserRoom(
      normalizedUserId
    );

  if (userRoom) {
    socket.join(userRoom);
  }

  socket.userId =
    normalizedUserId;

  console.log(
    `Socket ${socket.id} registered for user ${normalizedUserId}`
  );
};

// ==========================================
// REMOVE USER SOCKET
// ==========================================

const unregisterUserSocket = (
  socket
) => {
  const userId =
    socket?.userId;

  if (!userId) {
    return;
  }

  const existingSockets =
    connectedUsers.get(
      String(userId)
    );

  if (!existingSockets) {
    return;
  }

  existingSockets.delete(
    socket.id
  );

  if (
    existingSockets.size === 0
  ) {
    connectedUsers.delete(
      String(userId)
    );
  }

  console.log(
    `Socket ${socket.id} unregistered from user ${userId}`
  );
};

// ==========================================
// SOCKET.IO CONNECTION
// ==========================================

io.on("connection", (socket) => {
  console.log(
    `ZenvaZapp Socket.IO user connected: ${socket.id}`
  );

  // ========================================
  // REGISTER USER
  // ========================================

  socket.on(
    "register-user",
    (userId) => {
      if (!userId) {
        console.log(
          "User registration rejected: userId missing."
        );

        return;
      }

      registerUserSocket(
        userId,
        socket
      );
    }
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

      socket.join(
        conversationId
      );

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

      socket.leave(
        conversationId
      );

      console.log(
        `Socket ${socket.id} left conversation: ${conversationId}`
      );
    }
  );

  // ========================================
  // REAL-TIME NEW MESSAGE
  // ========================================

  socket.on(
    "send-message",
    (message) => {
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

      socket
        .to(conversationId)
        .emit(
          "new-message",
          message
        );
    }
  );

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

      if (
        !message._id &&
        !message.id
      ) {
        console.log(
          "Edited message rejected: message ID missing."
        );

        return;
      }

      console.log(
        `Message edited: ${
          message._id ||
          message.id
        }`
      );

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

      if (
        !message._id &&
        !message.id
      ) {
        console.log(
          "Delete-for-everyone rejected: message ID missing."
        );

        return;
      }

      console.log(
        `Message deleted for everyone: ${
          message._id ||
          message.id
        }`
      );

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

      if (
        !message._id &&
        !message.id
      ) {
        return;
      }

      console.log(
        `Message deleted for one user: ${
          message._id ||
          message.id
        }`
      );

      /*
       * Delete-for-me stays local to the
       * requesting browser.
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

      if (
        !message._id &&
        !message.id
      ) {
        console.log(
          "Undo rejected: message ID missing."
        );

        return;
      }

      console.log(
        `Message undone: ${
          message._id ||
          message.id
        }`
      );

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

  // ==========================================
  // CALL — OFFER
  // ==========================================
  //
  // Caller sends the WebRTC offer to the
  // intended receiver only.
  //
  // IMPORTANT:
  // PrivateChat.js expects the receiver to
  // receive "call-offer".
  //

  socket.on(
    "call-offer",
    ({
      receiverId,
      callerId,
      conversationId,
      callType,
      offer,
      callerName,
      callerAvatar,
    } = {}) => {
      if (
        !receiverId ||
        !callerId ||
        !offer
      ) {
        console.log(
          "Call offer rejected: required data missing."
        );

        return;
      }

      const receiverRoom =
        getUserRoom(
          receiverId
        );

      if (!receiverRoom) {
        return;
      }

      console.log(
        `Call offer: ${callerId} -> ${receiverId} (${callType})`
      );

      io.to(receiverRoom).emit(
        "call-offer",
        {
          callerId,
          receiverId,
          conversationId:
            conversationId || "",
          callType:
            callType || "audio",
          offer,
          callerName:
            callerName ||
            "ZenvaZapp User",
          callerAvatar:
            callerAvatar || "",
        }
      );
    }
  );

  // ==========================================
  // CALL — ANSWER
  // ==========================================
  //
  // Receiver sends the WebRTC answer back
  // to the caller.
  //
  // IMPORTANT:
  // PrivateChat.js expects "call-answer".
  //

  socket.on(
    "call-answer",
    ({
      callerId,
      receiverId,
      conversationId,
      answer,
    } = {}) => {
      if (
        !callerId ||
        !receiverId ||
        !answer
      ) {
        console.log(
          "Call answer rejected: required data missing."
        );

        return;
      }

      const callerRoom =
        getUserRoom(
          callerId
        );

      if (!callerRoom) {
        return;
      }

      console.log(
        `Call answer: ${receiverId} -> ${callerId}`
      );

      io.to(callerRoom).emit(
        "call-answer",
        {
          callerId,
          receiverId,
          conversationId:
            conversationId || "",
          answer,
        }
      );
    }
  );

  // ==========================================
  // CALL — ICE CANDIDATE
  // ==========================================
  //
  // IMPORTANT:
  // PrivateChat.js expects "call-ice-candidate".
  //

  socket.on(
    "call-ice-candidate",
    ({
      targetUserId,
      senderUserId,
      conversationId,
      candidate,
    } = {}) => {
      if (
        !targetUserId ||
        !senderUserId ||
        !candidate
      ) {
        console.log(
          "ICE candidate rejected: required data missing."
        );

        return;
      }

      const targetRoom =
        getUserRoom(
          targetUserId
        );

      if (!targetRoom) {
        return;
      }

      console.log(
        `ICE candidate: ${senderUserId} -> ${targetUserId}`
      );

      io.to(targetRoom).emit(
        "call-ice-candidate",
        {
          targetUserId,
          senderUserId,
          conversationId:
            conversationId || "",
          candidate,
        }
      );
    }
  );

  // ==========================================
  // CALL — REJECT
  // ==========================================

  socket.on(
    "call-rejected",
    ({
      callerId,
      receiverId,
      conversationId,
      reason,
    } = {}) => {
      if (
        !callerId ||
        !receiverId
      ) {
        return;
      }

      const callerRoom =
        getUserRoom(
          callerId
        );

      if (!callerRoom) {
        return;
      }

      console.log(
        `Call rejected: ${receiverId} -> ${callerId}`
      );

      io.to(callerRoom).emit(
        "call-rejected",
        {
          callerId,
          receiverId,
          conversationId:
            conversationId || "",
          reason:
            reason ||
            "Call declined.",
        }
      );
    }
  );

  // ==========================================
  // CALL — ENDED
  // ==========================================

  socket.on(
    "call-ended",
    ({
      targetUserId,
      senderUserId,
      conversationId,
    } = {}) => {
      if (
        !targetUserId ||
        !senderUserId
      ) {
        return;
      }

      const targetRoom =
        getUserRoom(
          targetUserId
        );

      if (!targetRoom) {
        return;
      }

      console.log(
        `Call ended: ${senderUserId} -> ${targetUserId}`
      );

      io.to(targetRoom).emit(
        "call-ended",
        {
          targetUserId,
          senderUserId,
          conversationId:
            conversationId || "",
        }
      );
    }
  );

  // ========================================
  // DISCONNECT
  // ========================================

  socket.on(
    "disconnect",
    () => {
      unregisterUserSocket(
        socket
      );

      console.log(
        `ZenvaZapp Socket.IO user disconnected: ${socket.id}`
      );
    }
  );
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
  .connect(
    process.env.MONGO_URI
  )
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

process.on(
  "SIGINT",
  () => {
    console.log(
      "Shutting down ZenvaZapp server..."
    );

    server.close(() => {
      mongoose.connection.close();

      process.exit(0);
    });
  }
);
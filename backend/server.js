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
        String(conversationId)
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
        String(conversationId)
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
        .to(String(conversationId))
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
        .to(String(conversationId))
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
        .to(String(conversationId))
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
        .to(String(conversationId))
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
        .to(String(conversationId))
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
        .to(String(conversationId))
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
        `CALL OFFER: ${callerId} -> ${receiverId} (${callType || "audio"})`
      );

      io.to(receiverRoom).emit(
        "call-offer",
        {
          callerId:
            String(callerId),

          receiverId:
            String(receiverId),

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
        `CALL ANSWER: ${receiverId} -> ${callerId}`
      );

      io.to(callerRoom).emit(
        "call-answer",
        {
          callerId:
            String(callerId),

          receiverId:
            String(receiverId),

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
  // Supports BOTH naming formats:
  //
  // senderId / receiverId
  //
  // and
  //
  // senderUserId / targetUserId
  //
  // This keeps the signaling compatible with
  // the current PrivateChat implementation.
  //

  socket.on(
    "call-ice-candidate",
    ({
      targetUserId,
      senderUserId,
      receiverId,
      senderId,
      conversationId,
      candidate,
    } = {}) => {
      const actualTargetUserId =
        targetUserId ||
        receiverId;

      const actualSenderUserId =
        senderUserId ||
        senderId;

      if (
        !actualTargetUserId ||
        !actualSenderUserId ||
        !candidate
      ) {
        console.log(
          "ICE candidate rejected: required data missing."
        );

        return;
      }

      const targetRoom =
        getUserRoom(
          actualTargetUserId
        );

      if (!targetRoom) {
        return;
      }

      console.log(
        `ICE CANDIDATE: ${actualSenderUserId} -> ${actualTargetUserId}`
      );

      io.to(targetRoom).emit(
        "call-ice-candidate",
        {
          conversationId:
            conversationId || "",

          senderId:
            String(actualSenderUserId),

          receiverId:
            String(actualTargetUserId),

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
        `CALL REJECTED: ${receiverId} -> ${callerId}`
      );

      io.to(callerRoom).emit(
        "call-rejected",
        {
          callerId:
            String(callerId),

          receiverId:
            String(receiverId),

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
  //
  // Supports the current PrivateChat payload:
  //
  // callerId
  // receiverId
  //
  // and the alternate:
  //
  // senderUserId
  // targetUserId
  //

  socket.on(
    "call-ended",
    ({
      targetUserId,
      senderUserId,
      callerId,
      receiverId,
      conversationId,
    } = {}) => {
      const actualTargetUserId =
        targetUserId ||
        receiverId;

      const actualSenderUserId =
        senderUserId ||
        callerId;

      if (
        !actualTargetUserId ||
        !actualSenderUserId
      ) {
        console.log(
          "Call ended rejected: user IDs missing."
        );

        return;
      }

      const targetRoom =
        getUserRoom(
          actualTargetUserId
        );

      if (!targetRoom) {
        return;
      }

      console.log(
        `CALL ENDED: ${actualSenderUserId} -> ${actualTargetUserId}`
      );

      io.to(targetRoom).emit(
        "call-ended",
        {
          targetUserId:
            String(actualTargetUserId),

          senderUserId:
            String(actualSenderUserId),

          callerId:
            String(actualSenderUserId),

          receiverId:
            String(actualTargetUserId),

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
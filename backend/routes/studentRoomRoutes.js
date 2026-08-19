const express = require("express");

const {
  createRoom,
  getUserRooms,
  getRoom,
  addMembers,
  getInvite,
  joinRoom,
  leaveRoom,
} = require("../controller/studentRoomController");

const router = express.Router();

// ==========================================
// CREATE STUDENT ROOM
// ==========================================
//
// POST /api/student-rooms
//
// ==========================================

router.post(
  "/",
  createRoom
);

// ==========================================
// GET ROOMS FOR USER
// ==========================================
//
// GET /api/student-rooms/user/:userId
//
// IMPORTANT:
// This route must appear BEFORE /:roomId.
//
// ==========================================

router.get(
  "/user/:userId",
  getUserRooms
);

// ==========================================
// JOIN USING INVITE CODE
// ==========================================
//
// POST /api/student-rooms/join
//
// ==========================================

router.post(
  "/join",
  joinRoom
);

// ==========================================
// GET INVITE
// ==========================================
//
// GET /api/student-rooms/:roomId/invite
//
// ==========================================

router.get(
  "/:roomId/invite",
  getInvite
);

// ==========================================
// ADD MEMBERS
// ==========================================
//
// PATCH /api/student-rooms/:roomId/members
//
// ==========================================

router.patch(
  "/:roomId/members",
  addMembers
);

// ==========================================
// LEAVE ROOM
// ==========================================
//
// PATCH /api/student-rooms/:roomId/leave
//
// ==========================================

router.patch(
  "/:roomId/leave",
  leaveRoom
);

// ==========================================
// GET SINGLE ROOM
// ==========================================
//
// GET /api/student-rooms/:roomId
//
// ==========================================

router.get(
  "/:roomId",
  getRoom
);

module.exports = router;
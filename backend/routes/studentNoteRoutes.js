const express = require("express");

const {
  getUserNotes,
  createNote,
  updateNote,
  deleteNote,
} = require("./controller/studentNoteController");

const router = express.Router();

// ==========================================
// GET USER NOTES
// ==========================================
//
// GET
// /api/student-notes/user/:userId
//
// ==========================================

router.get(
  "/user/:userId",
  getUserNotes
);

// ==========================================
// CREATE NOTE
// ==========================================
//
// POST
// /api/student-notes
//
// ==========================================

router.post(
  "/",
  createNote
);

// ==========================================
// UPDATE NOTE
// ==========================================
//
// PATCH
// /api/student-notes/:noteId
//
// ==========================================

router.patch(
  "/:noteId",
  updateNote
);

// ==========================================
// DELETE NOTE
// ==========================================
//
// DELETE
// /api/student-notes/:noteId
//
// ==========================================

router.delete(
  "/:noteId",
  deleteNote
);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;
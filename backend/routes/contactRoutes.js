const express = require("express");

const {
  getContacts,
  addContact,
  createInvitation,
  removeContact,
  getContactProfile,
  toggleFavorite,
  markRecentlyContacted,
  getRecentlyContacted,
  getFavoriteContacts,
} = require("../controller/contactController");

const router = express.Router();

// ==========================================
// 1. INVITATIONS
// ==========================================
router.post("/invite", createInvitation);
router.post("/invitations", createInvitation);

// ==========================================
// 2. STATIC LISTS & FILTERS
// ==========================================
router.get("/recently-contacted", getRecentlyContacted);
router.get("/recent", getRecentlyContacted);
router.get("/favorites", getFavoriteContacts);

// ==========================================
// 3. BASE CONTACT OPERATIONS
// ==========================================
router.get("/", getContacts);
router.post("/", addContact);

// ==========================================
// 4. ACTION UPDATES
// ==========================================
router.patch("/recently-contacted", markRecentlyContacted);
router.patch("/favorite", toggleFavorite);

// ==========================================
// 5. PARAMETERIZED ROUTES
// ==========================================
router.patch("/:contactId/recent", markRecentlyContacted);
router.patch("/:contactId/favorite", toggleFavorite);
router.get("/:contactId", getContactProfile);
router.delete("/:contactId", removeContact);

module.exports = router;
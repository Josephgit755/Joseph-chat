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
} = require("../controller/contacts.controller");

const router = express.Router();

// ==========================================
// CONTACT LISTS & SPECIAL ENDPOINTS
// ==========================================

// GET /api/contacts?userId=...
router.get("/", getContacts);

// GET /api/contacts/recently-contacted?userId=...
router.get("/recently-contacted", getRecentlyContacted);
router.get("/recent", getRecentlyContacted);

// GET /api/contacts/favorites?userId=...
router.get("/favorites", getFavoriteContacts);

// ==========================================
// INVITATIONS
// ==========================================

// Supports both POST /api/contacts/invite and /api/contacts/invitations
router.post("/invite", createInvitation);
router.post("/invitations", createInvitation);

// ==========================================
// RECENTLY CONTACTED UPDATE
// ==========================================

// Supports PATCH /api/contacts/recently-contacted (body payload)
// and PATCH /api/contacts/:contactId/recent
router.patch("/recently-contacted", markRecentlyContacted);
router.patch("/:contactId/recent", markRecentlyContacted);

// ==========================================
// FAVORITE TOGGLE
// ==========================================

// Supports PATCH /api/contacts/favorite (body payload)
// and PATCH /api/contacts/:contactId/favorite
router.patch("/favorite", toggleFavorite);
router.patch("/:contactId/favorite", toggleFavorite);

// ==========================================
// CRUD OPERATIONS BY CONTACT ID
// ==========================================

// POST /api/contacts
router.post("/", addContact);

// GET /api/contacts/:contactId?userId=...
router.get("/:contactId", getContactProfile);

// DELETE /api/contacts/:contactId
router.delete("/:contactId", removeContact);

module.exports = router;
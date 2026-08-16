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

const router =
  express.Router();

// ==========================================
// CONTACTS
// ==========================================

// GET /api/contacts?userId=...
router.get(
  "/",
  getContacts
);

// GET /api/contacts/recent?userId=...
router.get(
  "/recent",
  getRecentlyContacted
);

// GET /api/contacts/favorites?userId=...
router.get(
  "/favorites",
  getFavoriteContacts
);

// ==========================================
// INVITATIONS
// ==========================================
//
// POST /api/contacts/invitations
//
// {
//   "userId": "...",
//   "phone": "+237XXXXXXXXX"
// }
//
// This records an invitation only after
// the user intentionally chooses to invite
// an unregistered phone number.
//

router.post(
  "/invitations",
  createInvitation
);

// ==========================================
// ADD CONTACT
// ==========================================
//
// POST /api/contacts
//
// Add by phone:
//
// {
//   "userId": "...",
//   "phone": "+237XXXXXXXXX"
// }
//
// Or by existing registered user ID.
//

router.post(
  "/",
  addContact
);

// PATCH /api/contacts/:contactId/recent
router.patch(
  "/:contactId/recent",
  markRecentlyContacted
);

// GET /api/contacts/:contactId?userId=...
router.get(
  "/:contactId",
  getContactProfile
);

// DELETE /api/contacts/:contactId
router.delete(
  "/:contactId",
  removeContact
);

// PATCH /api/contacts/:contactId/favorite
router.patch(
  "/:contactId/favorite",
  toggleFavorite
);

module.exports =
  router;
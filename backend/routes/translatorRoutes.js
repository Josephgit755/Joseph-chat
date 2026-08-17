const express = require("express");

const {
  translate,
} = require("../controller/translatorController");

const router = express.Router();

// ==========================================
// TRANSLATE TEXT
// ==========================================
//
// POST /api/translator/translate
//
// Body:
//
// {
//   "text": "Hello",
//   "sourceLanguage": "english",
//   "targetLanguage": "french"
// }
//
// ==========================================

router.post(
  "/translate",
  translate
);

module.exports = router;
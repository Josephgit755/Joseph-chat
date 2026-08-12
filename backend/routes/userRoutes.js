const express = require("express");

const {
  getUsers,
} = require("../controller/userController");

const router = express.Router();

// Get registered users
router.get("/", getUsers);

module.exports = router;
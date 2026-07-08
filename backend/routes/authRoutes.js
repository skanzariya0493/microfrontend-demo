const express = require("express");
const router = express.Router();

const { login, profile } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

router.post("/login", login);
router.get("/profile", requireAuth, profile);

module.exports = router;
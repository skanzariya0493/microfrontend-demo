const express = require("express");
const router = express.Router();

const { login, profile, signup } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);
router.get("/profile", requireAuth, profile);

module.exports = router;
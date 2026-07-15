const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  advanceOrder,
} = require("../controllers/orderController");
const { requireAuth, requireSuperAdmin, optionalAuth } = require("../middleware/auth");

// Reading orders requires login; the controller filters by role
// (super_admin sees all, everyone else sees only their own).
router.get("/", requireAuth, getOrders);
router.get("/:id", requireAuth, getOrderById);

// Placing an order is open to guests, but if a token is present we stamp
// the order with that user so it shows up under "your orders".
router.post("/", optionalAuth, createOrder);

// Only a super admin advances an order to the next delivery stage
router.post("/:id/advance", requireAuth, requireSuperAdmin, advanceOrder);

module.exports = router;

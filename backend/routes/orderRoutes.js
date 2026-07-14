const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
} = require("../controllers/orderController");

// Public so the checkout flow works out of the box. Add an auth middleware
// before the handlers to protect these routes.
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);

module.exports = router;

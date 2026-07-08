const express = require("express");
const router = express.Router();

const {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  updateOrder,
} = require("../controllers/orderController");

const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getOrders);

router.get("/:id", requireAuth, (req, res) => {
  getOrderById(req, res, req.params.id);
});

router.post("/", requireAuth, createOrder);

router.put("/:id", requireAuth, (req, res) => {
  updateOrder(req, res, req.params.id);
});

router.patch("/:id", requireAuth, (req, res) => {
  updateOrder(req, res, req.params.id);
});

router.delete("/:id", requireAuth, (req, res) => {
  deleteOrder(req, res, req.params.id);
});

module.exports = router;
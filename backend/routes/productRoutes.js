const express = require("express");
const router = express.Router();

const {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} = require("../controllers/productController");

const { requireAuth } = require("../middleware/auth");

router.get("/", getProducts);

router.get("/:id", (req, res) => {
  getProductById(req, res, req.params.id);
});

router.post("/", requireAuth, createProduct);

router.put("/:id", requireAuth, (req, res) => {
  updateProduct(req, res, req.params.id);
});

router.patch("/:id", requireAuth, (req, res) => {
  updateProduct(req, res, req.params.id);
});

router.delete("/:id", requireAuth, (req, res) => {
  deleteProduct(req, res, req.params.id);
});

module.exports = router;
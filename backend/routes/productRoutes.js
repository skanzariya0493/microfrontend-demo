const express = require("express");
const router = express.Router();

const {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} = require("../controllers/productController");

// NOTE: these routes are currently public so the product form works out of the box.
// To protect writes, add a proper Express auth middleware (req, res, next) and pass
// it before the handler, e.g. router.post("/", requireAuth, createProduct).
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;

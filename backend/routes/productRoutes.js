const express = require("express");
const router = express.Router();

const {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} = require("../controllers/productController");
const { requireAuth, requireSuperAdmin } = require("../middleware/auth");

// Anyone can browse the catalog
router.get("/", getProducts);
router.get("/:id", getProductById);

// Only a super admin can create, edit or delete products
router.post("/", requireAuth, requireSuperAdmin, createProduct);
router.put("/:id", requireAuth, requireSuperAdmin, updateProduct);
router.patch("/:id", requireAuth, requireSuperAdmin, updateProduct);
router.delete("/:id", requireAuth, requireSuperAdmin, deleteProduct);

module.exports = router;

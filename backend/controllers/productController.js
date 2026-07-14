const productModel = require("../models/productModel");
const { sendJson } = require("../utils/http");

function normalizeBody(body = {}) {
  return {
    name: (body.name || "").trim(),
    description: (body.description || "").trim(),
    price: Number(body.price ?? 0),
    stock: Number(body.stock ?? 0),
    category: (body.category || "").trim(),
  };
}

const MAX_PRICE = 1_000_000;
const MAX_STOCK = 1_000_000;

function validateProduct(product) {
  if (!product.name) {
    return "Product name is required";
  }

  // Price: a finite number, not negative, within range, at most 2 decimals
  if (!Number.isFinite(product.price)) {
    return "Product price must be a valid number";
  }
  if (product.price < 0) {
    return "Product price cannot be negative";
  }
  if (product.price > MAX_PRICE) {
    return `Product price cannot exceed ${MAX_PRICE}`;
  }
  if (Math.abs(product.price * 100 - Math.round(product.price * 100)) > 1e-6) {
    return "Product price can have at most 2 decimal places";
  }

  // Stock: a whole number, not negative, within range
  if (!Number.isInteger(product.stock)) {
    return "Product stock must be a whole number";
  }
  if (product.stock < 0) {
    return "Product stock cannot be negative";
  }
  if (product.stock > MAX_STOCK) {
    return `Product stock cannot exceed ${MAX_STOCK}`;
  }

  return "";
}

async function getProducts(req, res) {
  try {
    const data = await productModel.findAll();
    sendJson(res, 200, { data });
  } catch (err) {
    console.error("getProducts failed:", err);
    sendJson(res, 500, { message: "Failed to load products" });
  }
}

async function getProductById(req, res) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      sendJson(res, 404, { message: "Product not found" });
      return;
    }
    sendJson(res, 200, { data: product });
  } catch (err) {
    console.error("getProductById failed:", err);
    sendJson(res, 500, { message: "Failed to load product" });
  }
}

async function createProduct(req, res) {
  try {
    const product = normalizeBody(req.body);
    const error = validateProduct(product);
    if (error) {
      sendJson(res, 400, { message: error });
      return;
    }
    const created = await productModel.insert(product);
    sendJson(res, 201, { message: "Product created", data: created });
  } catch (err) {
    console.error("createProduct failed:", err);
    sendJson(res, 500, { message: "Failed to create product" });
  }
}

async function updateProduct(req, res) {
  try {
    const existing = await productModel.findById(req.params.id);
    if (!existing) {
      sendJson(res, 404, { message: "Product not found" });
      return;
    }

    // Merge so a partial body keeps existing values
    const product = normalizeBody({ ...existing, ...req.body });
    const error = validateProduct(product);
    if (error) {
      sendJson(res, 400, { message: error });
      return;
    }

    const updated = await productModel.update(req.params.id, product);
    sendJson(res, 200, { message: "Product updated", data: updated });
  } catch (err) {
    console.error("updateProduct failed:", err);
    sendJson(res, 500, { message: "Failed to update product" });
  }
}

async function deleteProduct(req, res) {
  try {
    const deleted = await productModel.remove(req.params.id);
    if (!deleted) {
      sendJson(res, 404, { message: "Product not found" });
      return;
    }
    sendJson(res, 200, { message: "Product deleted", data: deleted });
  } catch (err) {
    console.error("deleteProduct failed:", err);
    sendJson(res, 500, { message: "Failed to delete product" });
  }
}

module.exports = {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
};

const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");
const { sendJson } = require("../utils/http");

const PAYMENT_METHODS = ["cod", "card", "upi"];
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 10;

function round2(value) {
  return Math.round(value * 100) / 100;
}

function normalizeCustomer(body = {}) {
  return {
    customerName: (body.customerName || "").trim(),
    email: (body.email || "").trim(),
    phone: (body.phone || "").trim(),
    addressLine: (body.addressLine || "").trim(),
    city: (body.city || "").trim(),
    state: (body.state || "").trim(),
    postalCode: (body.postalCode || "").trim(),
    paymentMethod: (body.paymentMethod || "").trim(),
  };
}

function validateCustomer(data) {
  if (!data.customerName) {
    return "Full name is required";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return "A valid email is required";
  }
  if (!data.phone) {
    return "Phone number is required";
  }
  if (!data.addressLine) {
    return "Address is required";
  }
  if (!data.city) {
    return "City is required";
  }
  if (!data.postalCode) {
    return "Postal code is required";
  }
  if (!PAYMENT_METHODS.includes(data.paymentMethod)) {
    return "Please choose a valid payment method";
  }
  return "";
}

async function createOrder(req, res) {
  try {
    const data = normalizeCustomer(req.body);
    const error = validateCustomer(data);
    if (error) {
      sendJson(res, 400, { message: error });
      return;
    }

    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    if (rawItems.length === 0) {
      sendJson(res, 400, { message: "Your cart is empty" });
      return;
    }

    // Recompute line items and totals from the DB so the client cannot tamper with prices
    const items = [];
    let subtotal = 0;
    for (const raw of rawItems) {
      const quantity = Number(raw.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        sendJson(res, 400, { message: "Invalid item quantity" });
        return;
      }
      const product = await productModel.findById(raw.productId);
      if (!product) {
        sendJson(res, 400, { message: `Product ${raw.productId} is no longer available` });
        return;
      }
      const lineTotal = round2(product.price * quantity);
      subtotal += lineTotal;
      items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        lineTotal,
      });
    }

    subtotal = round2(subtotal);
    const shipping = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
    const total = round2(subtotal + shipping);

    const created = await orderModel.insert({
      ...data,
      items,
      subtotal,
      shipping,
      total,
      status: "pending",
    });

    sendJson(res, 201, { message: "Order placed", data: created });
  } catch (err) {
    console.error("createOrder failed:", err);
    sendJson(res, 500, { message: "Failed to place order" });
  }
}

async function getOrders(req, res) {
  try {
    const data = await orderModel.findAll();
    sendJson(res, 200, { data });
  } catch (err) {
    console.error("getOrders failed:", err);
    sendJson(res, 500, { message: "Failed to load orders" });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) {
      sendJson(res, 404, { message: "Order not found" });
      return;
    }
    sendJson(res, 200, { data: order });
  } catch (err) {
    console.error("getOrderById failed:", err);
    sendJson(res, 500, { message: "Failed to load order" });
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
};

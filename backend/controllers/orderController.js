const pool = require("../config/db");
const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");
const { sendJson } = require("../utils/http");
const { sendOrderConfirmation } = require("../utils/mailer");

const PAYMENT_METHODS = ["cod", "card", "upi"];
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 10;

function isSuperAdmin(user) {
  return user?.role === "super_admin";
}

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

    // Run everything in one transaction: reserve stock for each item, then save
    // the order. If any item is short on stock, roll the whole thing back so no
    // stock is deducted and no order is created.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const items = [];
      let subtotal = 0;
      for (const raw of rawItems) {
        const quantity = Number(raw.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
          await client.query("ROLLBACK");
          sendJson(res, 400, { message: "Invalid item quantity" });
          return;
        }

        // Atomically reduce stock; null means missing or not enough stock
        const updated = await productModel.decrementStock(raw.productId, quantity, client);
        if (!updated) {
          const existing = await productModel.findById(raw.productId, client);
          await client.query("ROLLBACK");
          if (!existing) {
            sendJson(res, 400, { message: `Product ${raw.productId} is no longer available` });
          } else {
            sendJson(res, 400, {
              message: `Not enough stock for ${existing.name}. Only ${existing.stock} left.`,
            });
          }
          return;
        }

        const lineTotal = round2(updated.price * quantity);
        subtotal += lineTotal;
        items.push({
          productId: updated.id,
          name: updated.name,
          price: updated.price,
          quantity,
          lineTotal,
        });
      }

      subtotal = round2(subtotal);
      const shipping = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
      const total = round2(subtotal + shipping);

      const created = await orderModel.insert(
        {
          ...data,
          items,
          subtotal,
          shipping,
          total,
          status: "pending",
          userId: req.user?.id ?? null,
          userEmail: req.user?.email ?? null,
        },
        client
      );

      await client.query("COMMIT");

      // Send confirmation email in the background — never block or fail the order
      sendOrderConfirmation(created).catch((mailErr) =>
        console.error("Confirmation email failed:", mailErr.message)
      );

      sendJson(res, 201, { message: "Order placed", data: created });
    } catch (txErr) {
      await client.query("ROLLBACK").catch(() => {});
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("createOrder failed:", err);
    sendJson(res, 500, { message: "Failed to place order" });
  }
}

async function getOrders(req, res) {
  try {
    const superAdmin = isSuperAdmin(req.user);
    const data = superAdmin
      ? await orderModel.findAll()
      : await orderModel.findByUser(req.user.id);
    sendJson(res, 200, {
      data,
      scope: superAdmin ? "all" : "own",
      role: req.user.role,
    });
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
    // A regular user can only see their own order
    if (!isSuperAdmin(req.user) && order.userId !== req.user.id) {
      sendJson(res, 403, { message: "You cannot view this order" });
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

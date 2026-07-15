const pool = require("../config/db");

const COLUMNS = `
  id,
  user_id AS "userId",
  user_email AS "userEmail",
  customer_name AS "customerName",
  email,
  phone,
  address_line AS "addressLine",
  city,
  state,
  postal_code AS "postalCode",
  payment_method AS "paymentMethod",
  items,
  subtotal,
  shipping,
  total,
  status,
  created_at AS "createdAt"
`;

function normalize(row) {
  if (!row) {
    return null;
  }
  return {
    ...row,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
  };
}

async function initOrderTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address_line TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT DEFAULT '',
      postal_code TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      items JSONB NOT NULL DEFAULT '[]',
      subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
      shipping NUMERIC(10, 2) NOT NULL DEFAULT 0,
      total NUMERIC(10, 2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  // Link orders to the user who placed them (added for existing tables too)
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER;`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_email TEXT;`);
}

async function insert(data, executor = pool) {
  const result = await executor.query(
    `INSERT INTO orders
       (customer_name, email, phone, address_line, city, state, postal_code,
        payment_method, items, subtotal, shipping, total, status, user_id, user_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING ${COLUMNS}`,
    [
      data.customerName,
      data.email,
      data.phone,
      data.addressLine,
      data.city,
      data.state,
      data.postalCode,
      data.paymentMethod,
      JSON.stringify(data.items),
      data.subtotal,
      data.shipping,
      data.total,
      data.status || "pending",
      data.userId ?? null,
      data.userEmail ?? null,
    ]
  );
  return normalize(result.rows[0]);
}

async function findAll() {
  const result = await pool.query(`SELECT ${COLUMNS} FROM orders ORDER BY id DESC`);
  return result.rows.map(normalize);
}

async function findByUser(userId) {
  const result = await pool.query(
    `SELECT ${COLUMNS} FROM orders WHERE user_id = $1 ORDER BY id DESC`,
    [userId]
  );
  return result.rows.map(normalize);
}

async function findById(id) {
  const result = await pool.query(`SELECT ${COLUMNS} FROM orders WHERE id = $1`, [id]);
  return normalize(result.rows[0]);
}

module.exports = {
  initOrderTable,
  insert,
  findAll,
  findByUser,
  findById,
};

const pool = require("../config/db");

const COLUMNS = "id, name, description, price, stock, category";

// price is stored as NUMERIC -> pg returns it as a string; normalize to Number
function normalize(row) {
  if (!row) {
    return null;
  }
  return {
    ...row,
    price: Number(row.price),
    stock: Number(row.stock),
  };
}

async function initProductTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price NUMERIC(10, 2) NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}

async function findAll() {
  const result = await pool.query(
    `SELECT ${COLUMNS} FROM products ORDER BY id DESC`
  );
  return result.rows.map(normalize);
}

async function findById(id, executor = pool) {
  const result = await executor.query(
    `SELECT ${COLUMNS} FROM products WHERE id = $1`,
    [id]
  );
  return normalize(result.rows[0]);
}

/**
 * Atomically reduce a product's stock. The `stock >= $1` guard means the row is
 * only updated when there is enough stock, so concurrent orders cannot oversell.
 * Returns the updated product, or null if the product is missing or short on stock.
 * Pass a transaction client as `executor` to run inside a transaction.
 */
async function decrementStock(id, quantity, executor = pool) {
  const result = await executor.query(
    `UPDATE products
     SET stock = stock - $1, updated_at = now()
     WHERE id = $2 AND stock >= $1
     RETURNING ${COLUMNS}`,
    [quantity, id]
  );
  return normalize(result.rows[0]);
}

async function insert(data) {
  const result = await pool.query(
    `INSERT INTO products (name, description, price, stock, category)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNS}`,
    [data.name, data.description, data.price, data.stock, data.category]
  );
  return normalize(result.rows[0]);
}

async function update(id, data) {
  const result = await pool.query(
    `UPDATE products
     SET name = $1,
         description = $2,
         price = $3,
         stock = $4,
         category = $5,
         updated_at = now()
     WHERE id = $6
     RETURNING ${COLUMNS}`,
    [data.name, data.description, data.price, data.stock, data.category, id]
  );
  return normalize(result.rows[0]);
}

async function remove(id) {
  const result = await pool.query(
    `DELETE FROM products WHERE id = $1 RETURNING ${COLUMNS}`,
    [id]
  );
  return normalize(result.rows[0]);
}

module.exports = {
  initProductTable,
  findAll,
  findById,
  insert,
  update,
  remove,
  decrementStock,
};

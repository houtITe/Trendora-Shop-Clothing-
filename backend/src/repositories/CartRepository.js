const { pool } = require('../config/database');

async function findByUser(userId) {
  // JOIN cart_items and products in a single SQL query
  const [rows] = await pool.query(
    `SELECT c.cart_id, c.user_id, c.product_id, c.quantity,
            p.product_name, p.price, p.discount, p.stock, p.image, p.sku, p.barcode, p.size, p.color
     FROM cart_items c
     JOIN products p ON p.product_id = c.product_id
     WHERE c.user_id = ?`,
    [Number(userId)]
  );
  return rows.map((r) => ({
    cart_id: r.cart_id,
    user_id: r.user_id,
    product_id: r.product_id,
    quantity: r.quantity,
    product: {
      product_id: r.product_id,
      product_name: r.product_name,
      price: r.price,
      discount: r.discount,
      stock: r.stock,
      image: r.image,
      sku: r.sku,
      barcode: r.barcode,
      size: r.size,
      color: r.color,
    },
  }));
}

async function findOne(userId, productId) {
  // SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?
  const [rows] = await pool.query(
    'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
    [Number(userId), Number(productId)]
  );
  return rows[0] || null;
}

async function addItem(userId, productId, quantity) {
  // INSERT INTO cart_items (...) VALUES (...) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
  await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
    [Number(userId), Number(productId), Number(quantity)]
  );
  return findOne(userId, productId);
}

async function updateQuantity(userId, productId, quantity) {
  // UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?
  const [result] = await pool.query(
    'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
    [Number(quantity), Number(userId), Number(productId)]
  );
  if (result.affectedRows === 0) return null;
  return findOne(userId, productId);
}

async function removeItem(userId, productId) {
  // DELETE FROM cart_items WHERE user_id = ? AND product_id = ?
  const [result] = await pool.query(
    'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
    [Number(userId), Number(productId)]
  );
  return result.affectedRows > 0;
}

async function clear(userId) {
  // DELETE FROM cart_items WHERE user_id = ?
  await pool.query('DELETE FROM cart_items WHERE user_id = ?', [Number(userId)]);
  return true;
}

module.exports = { findByUser, findOne, addItem, updateQuantity, removeItem, clear };

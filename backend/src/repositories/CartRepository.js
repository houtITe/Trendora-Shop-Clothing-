const { pool } = require('../config/database');

async function findByUser(userId) {
  // SELECT * FROM cart_items WHERE user_id = ?
  const [rows] = await pool.query('SELECT * FROM cart_items WHERE user_id = ?', [Number(userId)]);
  return rows;
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

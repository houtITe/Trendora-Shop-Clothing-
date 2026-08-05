const { pool } = require('../config/database');

async function findByUser(userId) {
  // SELECT * FROM wishlists WHERE user_id = ?
  const [rows] = await pool.query('SELECT * FROM wishlists WHERE user_id = ?', [Number(userId)]);
  return rows;
}

async function findOne(userId, productId) {
  // SELECT * FROM wishlists WHERE user_id = ? AND product_id = ?
  const [rows] = await pool.query(
    'SELECT * FROM wishlists WHERE user_id = ? AND product_id = ?',
    [Number(userId), Number(productId)]
  );
  return rows[0] || null;
}

async function add(userId, productId) {
  // INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (...)
  await pool.query(
    'INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)',
    [Number(userId), Number(productId)]
  );
  return findOne(userId, productId);
}

async function remove(userId, productId) {
  // DELETE FROM wishlists WHERE user_id = ? AND product_id = ?
  const [result] = await pool.query(
    'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
    [Number(userId), Number(productId)]
  );
  return result.affectedRows > 0;
}

module.exports = { findByUser, findOne, add, remove };

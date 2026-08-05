const { pool } = require('../config/database');

async function findByProduct(productId) {
  // SELECT reviews + the reviewer's name, newest first
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS user_name
     FROM reviews r
     JOIN users u ON u.user_id = r.user_id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC`,
    [Number(productId)]
  );
  return rows;
}

async function findByUser(userId) {
  // SELECT reviews + the reviewed product's name/image, newest first
  const [rows] = await pool.query(
    `SELECT r.*, p.product_name, p.image AS product_image
     FROM reviews r
     JOIN products p ON p.product_id = r.product_id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC`,
    [Number(userId)]
  );
  return rows;
}

async function findRecommended(limit = 12) {
  // Public homepage feed: only reviews the reviewer marked as a
  // recommendation and actually left a comment on, newest first, with the
  // reviewer's name and the reviewed product's info attached.
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS user_name, p.product_name, p.image AS product_image
     FROM reviews r
     JOIN users u ON u.user_id = r.user_id
     JOIN products p ON p.product_id = r.product_id
     WHERE r.recommend = 1 AND r.comment IS NOT NULL AND r.comment != ''
     ORDER BY r.created_at DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
}

async function findRecent(limit = 10) {
  // SELECT * FROM reviews + reviewer name, most recent first
  const [rows] = await pool.query(
    `SELECT r.*, u.name AS user_name
     FROM reviews r
     JOIN users u ON u.user_id = r.user_id
     ORDER BY r.created_at DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
}

async function findById(id) {
  // SELECT * FROM reviews WHERE review_id = ?
  const [rows] = await pool.query('SELECT * FROM reviews WHERE review_id = ?', [Number(id)]);
  return rows[0] || null;
}

async function create(data) {
  // INSERT INTO reviews (user_id, product_id, rating, comment, recommend, photo) VALUES (...)
  const [result] = await pool.query(
    'INSERT INTO reviews (user_id, product_id, rating, comment, recommend, photo) VALUES (?, ?, ?, ?, ?, ?)',
    [
      Number(data.user_id),
      Number(data.product_id),
      Number(data.rating),
      data.comment || null,
      data.recommend === undefined ? 1 : Number(!!data.recommend),
      data.photo || null,
    ]
  );
  return findById(result.insertId);
}

async function update(id, changes) {
  // UPDATE reviews SET rating = ?, comment = ?, recommend = ?, photo = ? WHERE review_id = ?
  const existing = await findById(id);
  if (!existing) return null;
  await pool.query('UPDATE reviews SET rating = ?, comment = ?, recommend = ?, photo = ? WHERE review_id = ?', [
    changes.rating ?? existing.rating,
    changes.comment ?? existing.comment,
    changes.recommend === undefined ? existing.recommend : Number(!!changes.recommend),
    changes.photo ?? existing.photo,
    Number(id),
  ]);
  return findById(id);
}

async function remove(id) {
  // DELETE FROM reviews WHERE review_id = ?
  const [result] = await pool.query('DELETE FROM reviews WHERE review_id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

module.exports = { findByProduct, findByUser, findRecommended, findRecent, findById, create, update, remove };

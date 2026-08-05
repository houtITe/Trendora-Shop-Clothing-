const { pool } = require('../config/database');

async function findAll() {
  // SELECT * FROM categories ORDER BY category_id
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY category_id');
  return rows;
}

async function findById(id) {
  // SELECT * FROM categories WHERE category_id = ?
  const [rows] = await pool.query('SELECT * FROM categories WHERE category_id = ?', [Number(id)]);
  return rows[0] || null;
}

async function create(data) {
  // INSERT INTO categories (category_name) VALUES (?)
  const [result] = await pool.query('INSERT INTO categories (category_name) VALUES (?)', [data.category_name]);
  return findById(result.insertId);
}

async function update(id, changes) {
  // UPDATE categories SET category_name = ? WHERE category_id = ?
  const existing = await findById(id);
  if (!existing) return null;
  await pool.query('UPDATE categories SET category_name = ? WHERE category_id = ?', [
    changes.category_name ?? existing.category_name,
    Number(id),
  ]);
  return findById(id);
}

async function remove(id) {
  // DELETE FROM categories WHERE category_id = ?
  const [result] = await pool.query('DELETE FROM categories WHERE category_id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };

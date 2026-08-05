const { pool } = require('../config/database');

async function findAll() {
  // SELECT * FROM brands ORDER BY brand_id
  const [rows] = await pool.query('SELECT * FROM brands ORDER BY brand_id');
  return rows;
}

async function findById(id) {
  // SELECT * FROM brands WHERE brand_id = ?
  const [rows] = await pool.query('SELECT * FROM brands WHERE brand_id = ?', [Number(id)]);
  return rows[0] || null;
}

async function create(data) {
  // INSERT INTO brands (brand_name) VALUES (?)
  const [result] = await pool.query('INSERT INTO brands (brand_name) VALUES (?)', [data.brand_name]);
  return findById(result.insertId);
}

async function update(id, changes) {
  // UPDATE brands SET brand_name = ? WHERE brand_id = ?
  const existing = await findById(id);
  if (!existing) return null;
  await pool.query('UPDATE brands SET brand_name = ? WHERE brand_id = ?', [
    changes.brand_name ?? existing.brand_name,
    Number(id),
  ]);
  return findById(id);
}

async function remove(id) {
  // DELETE FROM brands WHERE brand_id = ?
  const [result] = await pool.query('DELETE FROM brands WHERE brand_id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };

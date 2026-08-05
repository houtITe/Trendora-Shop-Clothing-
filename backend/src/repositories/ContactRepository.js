const { pool } = require('../config/database');

async function create(data) {
  // INSERT INTO contact_messages (name, email, subject, message) VALUES (...)
  const [result] = await pool.query(
    'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
    [data.name, data.email, data.subject || null, data.message]
  );
  const [rows] = await pool.query('SELECT * FROM contact_messages WHERE contact_id = ?', [result.insertId]);
  return rows[0];
}

async function findAll() {
  // SELECT * FROM contact_messages ORDER BY created_at DESC
  const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
  return rows;
}

module.exports = { create, findAll };

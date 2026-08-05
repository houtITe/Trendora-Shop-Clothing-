const { pool } = require('../config/database');

async function findByOrder(orderId) {
  // SELECT * FROM payments WHERE order_id = ?
  const [rows] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [Number(orderId)]);
  return rows;
}

async function findAll({ offset, limit } = {}) {
  // SELECT * FROM payments ORDER BY payment_date DESC LIMIT ? OFFSET ?
  let sql = 'SELECT * FROM payments ORDER BY payment_date DESC';
  const params = [];
  if (offset !== undefined) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
  }
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function create(data) {
  // INSERT INTO payments (order_id, user_id, amount, payment_method, status) VALUES (...)
  const row = { user_id: null, status: 'Completed', ...data };
  const [result] = await pool.query(
    `INSERT INTO payments (order_id, user_id, amount, payment_method, status)
     VALUES (?, ?, ?, ?, ?)`,
    [Number(row.order_id), row.user_id, Number(row.amount), row.payment_method, row.status]
  );
  const [rows] = await pool.query('SELECT * FROM payments WHERE payment_id = ?', [result.insertId]);
  return rows[0];
}

module.exports = { findByOrder, findAll, create };

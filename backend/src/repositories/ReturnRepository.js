const { pool } = require('../config/database');

async function findByOrder(orderId) {
  // SELECT * FROM returns WHERE order_id = ?
  const [rows] = await pool.query('SELECT * FROM returns WHERE order_id = ?', [Number(orderId)]);
  return rows;
}

async function findAll({ offset, limit } = {}) {
  // SELECT * FROM returns ORDER BY return_date DESC LIMIT ? OFFSET ?
  let sql = 'SELECT * FROM returns ORDER BY return_date DESC';
  const params = [];
  if (offset !== undefined) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
  }
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function create(data, clientOrPool = pool) {
  // INSERT INTO returns (order_id, product_id, quantity, type, reason, exchange_product_id, staff_id) VALUES (...)
  const row = { type: 'return', reason: null, exchange_product_id: null, ...data };
  const [result] = await clientOrPool.query(
    `INSERT INTO returns (order_id, product_id, quantity, type, reason, exchange_product_id, staff_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [Number(row.order_id), Number(row.product_id), Number(row.quantity), row.type, row.reason, row.exchange_product_id, Number(row.staff_id)]
  );
  const [rows] = await clientOrPool.query('SELECT * FROM returns WHERE return_id = ?', [result.insertId]);
  return rows[0];
}

module.exports = { findByOrder, findAll, create };

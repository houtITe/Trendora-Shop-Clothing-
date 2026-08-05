const { pool } = require('../config/database');

async function findAll({ offset, limit } = {}) {
  // SELECT * FROM orders ORDER BY order_date DESC LIMIT ? OFFSET ?
  let sql = 'SELECT * FROM orders ORDER BY order_date DESC';
  const params = [];
  if (offset !== undefined) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
  }
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function count() {
  // SELECT COUNT(*) FROM orders
  const [[row]] = await pool.query('SELECT COUNT(*) AS total FROM orders');
  return row.total;
}

async function findByUser(userId) {
  // SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC
  const [rows] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC', [Number(userId)]);
  return rows;
}

async function findByCashier(cashierId) {
  // SELECT * FROM orders WHERE cashier_id = ? ORDER BY order_date DESC  (Staff dashboard / POS history)
  const [rows] = await pool.query('SELECT * FROM orders WHERE cashier_id = ? ORDER BY order_date DESC', [Number(cashierId)]);
  return rows;
}

async function findById(id) {
  // SELECT * FROM orders WHERE order_id = ?
  const [rows] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [Number(id)]);
  return rows[0] || null;
}

async function create(data) {
  // INSERT INTO orders (user_id, total, status, channel, cashier_id, shipping_address) VALUES (...)
  const row = {
    user_id: null,
    status: 'Pending',
    channel: 'Online',
    cashier_id: null,
    shipping_address: null,
    ...data,
  };
  const [result] = await pool.query(
    `INSERT INTO orders (user_id, total, status, channel, cashier_id, shipping_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.user_id, row.total, row.status, row.channel, row.cashier_id, row.shipping_address]
  );
  return findById(result.insertId);
}

async function updateStatus(id, status) {
  // UPDATE orders SET status = ? WHERE order_id = ?
  await pool.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, Number(id)]);
  return findById(id);
}

async function cancel(id) {
  return updateStatus(id, 'Cancelled');
}

/* ---------------------- Order line items ---------------------- */

async function findDetailsByOrder(orderId) {
  // SELECT * FROM order_details WHERE order_id = ?
  const [rows] = await pool.query('SELECT * FROM order_details WHERE order_id = ?', [Number(orderId)]);
  return rows;
}

async function addDetail(data) {
  // INSERT INTO order_details (order_id, product_id, quantity, price) VALUES (...)
  const [result] = await pool.query(
    'INSERT INTO order_details (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
    [Number(data.order_id), Number(data.product_id), Number(data.quantity), Number(data.price)]
  );
  const [rows] = await pool.query('SELECT * FROM order_details WHERE order_detail_id = ?', [result.insertId]);
  return rows[0];
}

module.exports = {
  findAll,
  count,
  findByUser,
  findByCashier,
  findById,
  create,
  updateStatus,
  cancel,
  findDetailsByOrder,
  addDetail,
};

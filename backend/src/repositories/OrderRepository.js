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

async function findById(id, clientOrPool = pool) {
  // SELECT * FROM orders WHERE order_id = ?
  const [rows] = await clientOrPool.query('SELECT * FROM orders WHERE order_id = ?', [Number(id)]);
  return rows[0] || null;
}

async function create(data, clientOrPool = pool) {
  // INSERT INTO orders (user_id, total, shipping_fee, status, channel, cashier_id, shipping_address) VALUES (...)
  const row = {
    user_id: null,
    total: 0,
    shipping_fee: 0,
    status: 'Pending',
    channel: 'Online',
    cashier_id: null,
    shipping_address: null,
    ...data,
  };
  const [result] = await clientOrPool.query(
    `INSERT INTO orders (user_id, total, shipping_fee, status, channel, cashier_id, shipping_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [row.user_id, Number(row.total), Number(row.shipping_fee || 0), row.status, row.channel, row.cashier_id, row.shipping_address]
  );
  return findById(result.insertId, clientOrPool);
}

async function updateStatus(id, status, clientOrPool = pool) {
  // UPDATE orders SET status = ? WHERE order_id = ?
  await clientOrPool.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, Number(id)]);
  return findById(id, clientOrPool);
}

async function cancel(id, clientOrPool = pool) {
  return updateStatus(id, 'Cancelled', clientOrPool);
}

/* ---------------------- Order line items ---------------------- */

async function findDetailsByOrder(orderId, clientOrPool = pool) {
  // SELECT * FROM order_details WHERE order_id = ?
  const [rows] = await clientOrPool.query('SELECT * FROM order_details WHERE order_id = ?', [Number(orderId)]);
  return rows;
}

async function findDetailsWithProductsByOrder(orderId, clientOrPool = pool) {
  // JOIN order_details and products in a single SQL query
  const [rows] = await clientOrPool.query(
    `SELECT d.order_detail_id, d.order_id, d.product_id, d.quantity, d.price,
            p.product_name, p.image, p.sku, p.barcode, p.size, p.color, p.discount
     FROM order_details d
     LEFT JOIN products p ON p.product_id = d.product_id
     WHERE d.order_id = ?`,
    [Number(orderId)]
  );
  return rows.map((r) => ({
    order_detail_id: r.order_detail_id,
    order_id: r.order_id,
    product_id: r.product_id,
    quantity: r.quantity,
    price: r.price,
    product: {
      product_id: r.product_id,
      product_name: r.product_name,
      image: r.image,
      sku: r.sku,
      barcode: r.barcode,
      size: r.size,
      color: r.color,
      discount: r.discount,
      price: r.price,
    },
  }));
}

async function addDetail(data, clientOrPool = pool) {
  // INSERT INTO order_details (order_id, product_id, quantity, price) VALUES (...)
  const [result] = await clientOrPool.query(
    'INSERT INTO order_details (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
    [Number(data.order_id), Number(data.product_id), Number(data.quantity), Number(data.price)]
  );
  const [rows] = await clientOrPool.query('SELECT * FROM order_details WHERE order_detail_id = ?', [result.insertId]);
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
  findDetailsWithProductsByOrder,
  addDetail,
};

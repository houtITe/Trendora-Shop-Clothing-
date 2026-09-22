const { pool } = require('../config/database');

async function getSummary() {
  // A handful of aggregate queries against orders/products/users.
  const [[revenueRow]] = await pool.query(
    "SELECT COALESCE(SUM(total), 0) AS totalRevenue FROM orders WHERE status != 'Cancelled'"
  );
  const [[orderRow]] = await pool.query('SELECT COUNT(*) AS totalOrders FROM orders');
  const [[productRow]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM products');
  const [[userRow]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');

  return {
    totalRevenue: Number(revenueRow.totalRevenue),
    totalOrders: orderRow.totalOrders,
    totalProducts: productRow.totalProducts,
    totalUsers: userRow.totalUsers,
  };
}

async function getLatestOrders(limit = 5) {
  // SELECT * FROM orders ORDER BY order_date DESC LIMIT ?
  const [rows] = await pool.query('SELECT * FROM orders ORDER BY order_date DESC LIMIT ?', [Number(limit)]);
  return rows;
}

async function getLatestUsers(limit = 5) {
  // SELECT * FROM users ORDER BY user_id DESC LIMIT ?
  const [rows] = await pool.query('SELECT * FROM users ORDER BY user_id DESC LIMIT ?', [Number(limit)]);
  return rows;
}

async function getTopProducts(limit = 5) {
  // SELECT product_id, SUM(quantity) qty FROM order_details GROUP BY product_id ORDER BY qty DESC LIMIT ?
  const [rows] = await pool.query(
    `SELECT p.*, d.qty AS quantitySold FROM (
       SELECT product_id, SUM(quantity) AS qty FROM order_details GROUP BY product_id ORDER BY qty DESC LIMIT ?
     ) d
     JOIN products p ON p.product_id = d.product_id`,
    [Number(limit)]
  );
  return rows.map((r) => {
    const { quantitySold, ...product } = r;
    return { product, quantitySold };
  });
}

async function getRecentReviews(limit = 5) {
  // SELECT * FROM reviews ORDER BY created_at DESC LIMIT ?
  const [rows] = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC LIMIT ?', [Number(limit)]);
  return rows;
}

/** Staff dashboard: today's POS sales/transactions for one cashier. */
async function getStaffSummary(cashierId) {
  const [[row]] = await pool.query(
    `SELECT
       COALESCE(SUM(total), 0) AS todaysSales,
       COUNT(*) AS todaysTransactions
     FROM orders
     WHERE cashier_id = ? AND channel = 'POS' AND order_date >= CURDATE() AND order_date < CURDATE() + INTERVAL 1 DAY`,
    [Number(cashierId)]
  );
  return { todaysSales: Number(row.todaysSales), todaysTransactions: row.todaysTransactions };
}

async function getRecentTransactionsByCashier(cashierId, limit = 8) {
  const [rows] = await pool.query(
    `SELECT * FROM orders WHERE cashier_id = ? AND channel = 'POS' ORDER BY order_date DESC LIMIT ?`,
    [Number(cashierId), Number(limit)]
  );
  return rows;
}

module.exports = {
  getSummary,
  getLatestOrders,
  getLatestUsers,
  getTopProducts,
  getRecentReviews,
  getStaffSummary,
  getRecentTransactionsByCashier,
};

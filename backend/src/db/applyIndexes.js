require('dotenv').config();
const { pool } = require('../config/database');

async function indexExists(table, indexName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName]
  );
  return rows[0].cnt > 0;
}

async function addIndex(table, indexName, columnsSql) {
  if (await indexExists(table, indexName)) {
    console.log(`[indexes] ${table}.${indexName} already exists, skipping.`);
    return;
  }
  console.log(`[indexes] adding ${table}.${indexName} on (${columnsSql}) ...`);
  await pool.query(`ALTER TABLE ${table} ADD INDEX ${indexName} (${columnsSql})`);
}

async function run() {
  await addIndex('users', 'idx_users_reset_token', 'reset_token');
  await addIndex('products', 'idx_products_price', 'price');
  await addIndex('orders', 'idx_orders_date', 'order_date');
  await addIndex('orders', 'idx_orders_status', 'status');
  await addIndex('orders', 'idx_orders_pos', 'cashier_id, channel, order_date');
  await addIndex('reviews', 'idx_reviews_product_date', 'product_id, created_at');

  console.log('[indexes] all indexes checked and applied successfully.');
  await pool.end();
}

run().catch((err) => {
  console.error('[indexes] failed to apply indexes:', err.message);
  process.exit(1);
});

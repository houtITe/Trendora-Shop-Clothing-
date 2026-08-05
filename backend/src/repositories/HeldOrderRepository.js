const { pool } = require('../config/database');

async function attachItems(heldOrder) {
  if (!heldOrder) return heldOrder;
  const [items] = await pool.query(
    'SELECT product_id, quantity FROM held_order_items WHERE held_id = ?',
    [heldOrder.held_id]
  );
  return { ...heldOrder, items };
}

async function findByCashier(cashierId) {
  // SELECT * FROM held_orders WHERE cashier_id = ? ORDER BY held_at DESC  (+ items per row)
  const [rows] = await pool.query('SELECT * FROM held_orders WHERE cashier_id = ? ORDER BY held_at DESC', [Number(cashierId)]);
  return Promise.all(rows.map(attachItems));
}

async function findAll() {
  // SELECT * FROM held_orders ORDER BY held_at DESC  (+ items per row) — Admin view
  const [rows] = await pool.query('SELECT * FROM held_orders ORDER BY held_at DESC');
  return Promise.all(rows.map(attachItems));
}

async function create(data) {
  // INSERT INTO held_orders (...) VALUES (...) + INSERT INTO held_order_items (...) per item
  const row = { customer_id: null, customer_name: 'Walk-in', discount_pct: 0, ...data };
  const [result] = await pool.query(
    `INSERT INTO held_orders (cashier_id, cashier_name, customer_id, customer_name, discount_pct)
     VALUES (?, ?, ?, ?, ?)`,
    [Number(row.cashier_id), row.cashier_name, row.customer_id, row.customer_name, Number(row.discount_pct)]
  );
  const heldId = result.insertId;

  for (const item of row.items || []) {
    await pool.query(
      'INSERT INTO held_order_items (held_id, product_id, quantity) VALUES (?, ?, ?)',
      [heldId, Number(item.product_id), Number(item.quantity)]
    );
  }

  const [rows] = await pool.query('SELECT * FROM held_orders WHERE held_id = ?', [heldId]);
  return attachItems(rows[0]);
}

async function remove(id) {
  // DELETE FROM held_orders WHERE held_id = ?  (held_order_items cascade)
  const [result] = await pool.query('DELETE FROM held_orders WHERE held_id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

module.exports = { findByCashier, findAll, create, remove };

const { pool } = require('../config/database');
const ApiError = require('../utils/ApiError');
const ReturnRepository = require('../repositories/ReturnRepository');
const OrderRepository = require('../repositories/OrderRepository');
const ProductRepository = require('../repositories/ProductRepository');

/**
 * Processes a Return or Exchange for one line item of an order:
 *  - puts the returned quantity back into stock
 *  - if it's an exchange, takes the replacement product's stock down
 *  - records the return and flips the order's status
 * Mirrors the Staff > Returns page in the frontend exactly.
 * Wrapped in an ACID MySQL transaction to ensure consistency.
 */
async function processReturn(staffId, { order_id, product_id, quantity, type, reason, exchange_product_id }) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const order = await OrderRepository.findById(order_id, conn);
    if (!order) throw ApiError.notFound('Order not found.');

    const product = await ProductRepository.findById(product_id, conn);
    if (!product) throw ApiError.notFound('Product not found.');

    if (type === 'exchange' && exchange_product_id) {
      const decremented = await ProductRepository.decrementStock(exchange_product_id, quantity, conn);
      if (!decremented) throw ApiError.badRequest('Not enough stock for the exchange product.');
    }

    await ProductRepository.incrementStock(product_id, quantity, conn);

    const record = await ReturnRepository.create({
      order_id,
      product_id,
      quantity,
      type: type || 'return',
      reason: reason || null,
      exchange_product_id: type === 'exchange' ? exchange_product_id || null : null,
      staff_id: staffId,
    }, conn);

    await OrderRepository.updateStatus(order_id, type === 'exchange' ? 'Exchanged' : 'Returned', conn);

    await conn.commit();
    return record;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getByOrder(orderId) {
  return ReturnRepository.findByOrder(orderId);
}

async function listRecent(limit = 10) {
  const rows = await ReturnRepository.findAll();
  return rows.slice(0, limit);
}

module.exports = { processReturn, getByOrder, listRecent };

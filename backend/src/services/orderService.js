const { pool } = require('../config/database');
const ApiError = require('../utils/ApiError');
const OrderRepository = require('../repositories/OrderRepository');
const ProductRepository = require('../repositories/ProductRepository');
const CartRepository = require('../repositories/CartRepository');
const PaymentRepository = require('../repositories/PaymentRepository');

/**
 * Shared checkout core used by both the customer-facing "place order" flow
 * and the Staff POS checkout flow. Validates stock, computes the total,
 * writes the order + line items + a payment record, and decrements stock.
 * Wrapped in a true ACID MySQL transaction to ensure consistency.
 */
async function checkout({ userId, items, shippingAddress, channel, cashierId, paymentMethod, shippingFee, discountPct, taxPct }) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const resolvedItems = [];
    let total = 0;
    for (const { product_id, quantity } of items) {
      const product = await ProductRepository.findById(product_id, conn);
      if (!product) throw ApiError.notFound(`Product ${product_id} not found.`);
      if (product.stock < quantity) throw ApiError.badRequest(`Not enough stock for "${product.product_name}".`);
      resolvedItems.push({ product, quantity });
      total += Number(product.price) * (1 - Number(product.discount || 0) / 100) * quantity;
    }
    // POS-only: manual discount/tax
    const discountAmt = total * (Number(discountPct || 0) / 100);
    const taxable = total - discountAmt;
    const taxAmt = taxable * (Number(taxPct || 0) / 100);
    // Free shipping threshold ($50+) applies to online channel orders
    const isFreeShipping = channel !== 'POS' && (total >= 50);
    const effectiveShippingFee = isFreeShipping ? 0 : Number(shippingFee || 0);
    total = Number((taxable + taxAmt + effectiveShippingFee).toFixed(2));

    const order = await OrderRepository.create({
      user_id: userId ?? null,
      total,
      shipping_fee: effectiveShippingFee,
      status: channel === 'POS' ? 'Delivered' : 'Pending',
      channel: channel || 'Online',
      cashier_id: cashierId ?? null,
      shipping_address: shippingAddress || null,
    }, conn);

    for (const { product, quantity } of resolvedItems) {
      await OrderRepository.addDetail({
        order_id: order.order_id,
        product_id: product.product_id,
        quantity,
        price: Number(product.price) * (1 - Number(product.discount || 0) / 100),
      }, conn);

      const decremented = await ProductRepository.decrementStock(product.product_id, quantity, conn);
      if (!decremented) {
        throw ApiError.badRequest(`Insufficient stock for "${product.product_name}". Transaction aborted.`);
      }
    }

    await PaymentRepository.create({
      order_id: order.order_id,
      user_id: userId ?? null,
      amount: total,
      payment_method: paymentMethod || 'Cash',
      status: 'Completed',
    }, conn);

    await conn.commit();
    return getOrderWithDetails(order.order_id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Customer checkout — always tied to the logged-in user, always Online.
async function createOrder(userId, { items, shippingAddress, paymentMethod, shippingFee }) {
  const order = await checkout({
    userId,
    items,
    shippingAddress,
    channel: 'Online',
    paymentMethod: paymentMethod || 'Cash',
    shippingFee,
  });
  await CartRepository.clear(userId);
  return order;
}

// Staff POS checkout — customer is optional (guest sale), cashier is required.
async function createPosSale(cashierId, { items, customerId, paymentMethod, discountPct, taxPct }) {
  return checkout({
    userId: customerId ?? null,
    items,
    channel: 'POS',
    cashierId,
    paymentMethod,
    discountPct,
    taxPct,
  });
}

async function getOrderWithDetails(orderId) {
  const order = await OrderRepository.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found.');
  const [items, payments] = await Promise.all([
    OrderRepository.findDetailsWithProductsByOrder(orderId),
    PaymentRepository.findByOrder(orderId),
  ]);
  return { ...order, items, payments };
}

async function getUserOrders(userId) {
  const orders = await OrderRepository.findByUser(userId);
  return Promise.all(orders.map((o) => getOrderWithDetails(o.order_id)));
}

async function getCashierOrders(cashierId) {
  const orders = await OrderRepository.findByCashier(cashierId);
  return Promise.all(orders.map((o) => getOrderWithDetails(o.order_id)));
}

async function cancelOrder(userId, orderId, isAdmin) {
  const order = await OrderRepository.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found.');
  if (!isAdmin && order.user_id !== Number(userId)) throw ApiError.forbidden('You cannot cancel this order.');
  if (order.status === 'Cancelled') throw ApiError.badRequest('Order is already cancelled.');
  if (['Delivered', 'Returned', 'Refunded', 'Exchanged'].includes(order.status)) {
    throw ApiError.badRequest(`${order.status} orders cannot be cancelled.`);
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const items = await OrderRepository.findDetailsByOrder(orderId, conn);
    for (const item of items) {
      await ProductRepository.incrementStock(item.product_id, item.quantity, conn);
    }
    await OrderRepository.cancel(orderId, conn);
    await PaymentRepository.updateStatusByOrder(orderId, 'Refunded', conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return getOrderWithDetails(orderId);
}

async function updateStatus(orderId, status) {
  const order = await OrderRepository.updateStatus(orderId, status);
  if (!order) throw ApiError.notFound('Order not found.');
  return getOrderWithDetails(orderId);
}

async function listAllOrders({ page, limit, offset }) {
  const [rows, total] = await Promise.all([OrderRepository.findAll({ offset, limit }), OrderRepository.count()]);
  const items = await Promise.all(rows.map((o) => getOrderWithDetails(o.order_id)));
  return { items, meta: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) } };
}

module.exports = {
  createOrder,
  createPosSale,
  getOrderWithDetails,
  getUserOrders,
  getCashierOrders,
  cancelOrder,
  updateStatus,
  listAllOrders,
};

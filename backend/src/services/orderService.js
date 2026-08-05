const ApiError = require('../utils/ApiError');
const OrderRepository = require('../repositories/OrderRepository');
const ProductRepository = require('../repositories/ProductRepository');
const CartRepository = require('../repositories/CartRepository');
const PaymentRepository = require('../repositories/PaymentRepository');

/**
 * Shared checkout core used by both the customer-facing "place order" flow
 * and the Staff POS checkout flow. Validates stock, computes the total,
 * writes the order + line items + a payment record, and decrements stock —
 * all products come out of the same `products.stock` column either way, so
 * online and in-store sales share one inventory.
 */
async function checkout({ userId, items, shippingAddress, channel, cashierId, paymentMethod, shippingFee, discountPct, taxPct }) {
  const resolvedItems = [];
  let total = 0;
  for (const { product_id, quantity } of items) {
    const product = await ProductRepository.findById(product_id);
    if (!product) throw ApiError.notFound(`Product ${product_id} not found.`);
    if (product.stock < quantity) throw ApiError.badRequest(`Not enough stock for "${product.product_name}".`);
    resolvedItems.push({ product, quantity });
    total += Number(product.price) * (1 - Number(product.discount || 0) / 100) * quantity;
  }
  // POS-only: a manual sale-wide discount/tax the cashier can dial in at
  // checkout (on top of each product's own discount, already applied
  // above). Line-item prices in order_details stay at the per-product
  // price — only the order's recorded total reflects this adjustment.
  const discountAmt = total * (Number(discountPct || 0) / 100);
  const taxable = total - discountAmt;
  const taxAmt = taxable * (Number(taxPct || 0) / 100);
  total = Number((taxable + taxAmt + Number(shippingFee || 0)).toFixed(2));

  const order = await OrderRepository.create({
    user_id: userId ?? null,
    total,
    status: channel === 'POS' ? 'Delivered' : 'Pending',
    channel: channel || 'Online',
    cashier_id: cashierId ?? null,
    shipping_address: shippingAddress || null,
  });

  for (const { product, quantity } of resolvedItems) {
    await OrderRepository.addDetail({
      order_id: order.order_id,
      product_id: product.product_id,
      quantity,
      price: Number(product.price) * (1 - Number(product.discount || 0) / 100),
    });
    await ProductRepository.decrementStock(product.product_id, quantity);
  }

  await PaymentRepository.create({
    order_id: order.order_id,
    user_id: userId ?? null,
    amount: total,
    payment_method: paymentMethod || 'Cash',
    status: 'Completed',
  });

  return getOrderWithDetails(order.order_id);
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
  const [details, payments] = await Promise.all([
    OrderRepository.findDetailsByOrder(orderId),
    PaymentRepository.findByOrder(orderId),
  ]);
  const items = await Promise.all(
    details.map(async (d) => ({ ...d, product: await ProductRepository.findById(d.product_id) }))
  );
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
  if (order.status === 'Delivered') throw ApiError.badRequest('Delivered orders cannot be cancelled.');
  await OrderRepository.cancel(orderId);
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

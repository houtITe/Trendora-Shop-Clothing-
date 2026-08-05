const ApiError = require('../utils/ApiError');
const CartRepository = require('../repositories/CartRepository');
const ProductRepository = require('../repositories/ProductRepository');

async function buildCartView(userId) {
  const items = await CartRepository.findByUser(userId);
  const detailed = await Promise.all(
    items.map(async (item) => {
      const product = await ProductRepository.findById(item.product_id);
      return { ...item, product };
    })
  );
  const subtotal = detailed.reduce((sum, i) => sum + (i.product ? i.product.price * i.quantity : 0), 0);
  return { items: detailed, subtotal };
}

async function getCart(userId) {
  return buildCartView(userId);
}

async function addItem(userId, productId, quantity = 1) {
  const product = await ProductRepository.findById(productId);
  if (!product) throw ApiError.notFound('Product not found.');
  if (product.stock < quantity) throw ApiError.badRequest('Not enough stock available.');
  await CartRepository.addItem(userId, productId, quantity);
  return buildCartView(userId);
}

async function updateQuantity(userId, productId, quantity) {
  const item = await CartRepository.updateQuantity(userId, productId, quantity);
  if (!item) throw ApiError.notFound('Item not found in cart.');
  return buildCartView(userId);
}

async function removeItem(userId, productId) {
  const removed = await CartRepository.removeItem(userId, productId);
  if (!removed) throw ApiError.notFound('Item not found in cart.');
  return buildCartView(userId);
}

async function clearCart(userId) {
  await CartRepository.clear(userId);
  return buildCartView(userId);
}

module.exports = { getCart, addItem, updateQuantity, removeItem, clearCart };

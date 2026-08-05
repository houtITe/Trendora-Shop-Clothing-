const ApiError = require('../utils/ApiError');
const WishlistRepository = require('../repositories/WishlistRepository');
const ProductRepository = require('../repositories/ProductRepository');

async function getWishlist(userId) {
  const items = await WishlistRepository.findByUser(userId);
  const detailed = await Promise.all(
    items.map(async (item) => ({ ...item, product: await ProductRepository.findById(item.product_id) }))
  );
  return detailed;
}

async function addItem(userId, productId) {
  const product = await ProductRepository.findById(productId);
  if (!product) throw ApiError.notFound('Product not found.');
  await WishlistRepository.add(userId, productId);
  return getWishlist(userId);
}

async function removeItem(userId, productId) {
  const removed = await WishlistRepository.remove(userId, productId);
  if (!removed) throw ApiError.notFound('Item not found in wishlist.');
  return getWishlist(userId);
}

module.exports = { getWishlist, addItem, removeItem };

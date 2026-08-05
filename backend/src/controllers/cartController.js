const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const cartService = require('../services/cartService');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.user_id);
  return ApiResponse.success(res, { message: 'Cart fetched.', data: { cart } });
});
const addItem = asyncHandler(async (req, res) => {
  const { product_id, quantity } = req.body;
  const cart = await cartService.addItem(req.user.user_id, product_id, quantity || 1);
  return ApiResponse.success(res, { message: 'Item added to cart.', data: { cart } });
});
const updateItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateQuantity(req.user.user_id, req.params.productId, req.body.quantity);
  return ApiResponse.success(res, { message: 'Cart updated.', data: { cart } });
});
const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user.user_id, req.params.productId);
  return ApiResponse.success(res, { message: 'Item removed from cart.', data: { cart } });
});
const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user.user_id);
  return ApiResponse.success(res, { message: 'Cart cleared.', data: { cart } });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };

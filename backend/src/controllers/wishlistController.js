const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const wishlistService = require('../services/wishlistService');

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.user_id);
  return ApiResponse.success(res, { message: 'Wishlist fetched.', data: { wishlist } });
});
const addItem = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.addItem(req.user.user_id, req.body.product_id);
  return ApiResponse.success(res, { message: 'Item added to wishlist.', data: { wishlist } });
});
const removeItem = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.removeItem(req.user.user_id, req.params.productId);
  return ApiResponse.success(res, { message: 'Item removed from wishlist.', data: { wishlist } });
});

module.exports = { getWishlist, addItem, removeItem };

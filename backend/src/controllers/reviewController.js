const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const reviewService = require('../services/reviewService');

const createReview = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.recommend !== undefined) payload.recommend = payload.recommend === 'true' || payload.recommend === true;
  if (req.file) payload.photo = `/uploads/reviews/${req.file.filename}`;
  const review = await reviewService.createReview(req.user.user_id, payload);
  return ApiResponse.created(res, { message: 'Review submitted.', data: { review } });
});
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getProductReviews(req.params.productId);
  return ApiResponse.success(res, { message: 'Reviews fetched.', data: { reviews } });
});
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getMyReviews(req.user.user_id);
  return ApiResponse.success(res, { message: 'Your reviews fetched.', data: { reviews } });
});
const getRecommendedReviews = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 12;
  const reviews = await reviewService.getRecommendedReviews(limit);
  return ApiResponse.success(res, { message: 'Recommended reviews fetched.', data: { reviews } });
});
const updateReview = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.recommend !== undefined) payload.recommend = payload.recommend === 'true' || payload.recommend === true;
  if (req.file) payload.photo = `/uploads/reviews/${req.file.filename}`;
  const review = await reviewService.updateReview(req.user.user_id, req.params.id, payload, req.user.role === 'admin');
  return ApiResponse.success(res, { message: 'Review updated.', data: { review } });
});
const deleteReview = asyncHandler(async (req, res) => {
  const result = await reviewService.deleteReview(req.user.user_id, req.params.id, req.user.role === 'admin');
  return ApiResponse.success(res, { message: result.message });
});

module.exports = { createReview, getProductReviews, getMyReviews, getRecommendedReviews, updateReview, deleteReview };

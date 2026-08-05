const ApiError = require('../utils/ApiError');
const ReviewRepository = require('../repositories/ReviewRepository');
const ProductRepository = require('../repositories/ProductRepository');

async function createReview(userId, { product_id, rating, comment, recommend, photo }) {
  const product = await ProductRepository.findById(product_id);
  if (!product) throw ApiError.notFound('Product not found.');
  return ReviewRepository.create({
    user_id: Number(userId),
    product_id: Number(product_id),
    rating,
    comment,
    recommend,
    photo,
  });
}

async function getProductReviews(productId) {
  return ReviewRepository.findByProduct(productId);
}

async function getMyReviews(userId) {
  return ReviewRepository.findByUser(userId);
}

async function getRecommendedReviews(limit) {
  return ReviewRepository.findRecommended(limit);
}

async function updateReview(userId, reviewId, changes, isAdmin) {
  const review = await ReviewRepository.findById(reviewId);
  if (!review) throw ApiError.notFound('Review not found.');
  if (!isAdmin && review.user_id !== Number(userId)) throw ApiError.forbidden('You cannot edit this review.');
  return ReviewRepository.update(reviewId, changes);
}

async function deleteReview(userId, reviewId, isAdmin) {
  const review = await ReviewRepository.findById(reviewId);
  if (!review) throw ApiError.notFound('Review not found.');
  if (!isAdmin && review.user_id !== Number(userId)) throw ApiError.forbidden('You cannot delete this review.');
  await ReviewRepository.remove(reviewId);
  return { message: 'Review deleted.' };
}

module.exports = { createReview, getProductReviews, getMyReviews, getRecommendedReviews, updateReview, deleteReview };

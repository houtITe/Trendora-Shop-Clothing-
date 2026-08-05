const express = require('express');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { uploadReviewPhoto } = require('../middleware/uploadMiddleware');
const {
  createReviewValidator,
  updateReviewValidator,
  idParamValidator,
} = require('../validators/reviewValidators');

const router = express.Router();

// NOTE: '/mine' must come before '/product/:productId' would otherwise be
// fine since the prefix differs, but keep it above the product route for
// readability — this is the logged-in user's own reviews.
router.get('/mine', authMiddleware, reviewController.getMyReviews);
router.get('/recommended', reviewController.getRecommendedReviews);
router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', authMiddleware, uploadReviewPhoto, createReviewValidator, validateRequest, reviewController.createReview);
router.put('/:id', authMiddleware, uploadReviewPhoto, idParamValidator, updateReviewValidator, validateRequest, reviewController.updateReview);
router.delete('/:id', authMiddleware, idParamValidator, validateRequest, reviewController.deleteReview);

module.exports = router;

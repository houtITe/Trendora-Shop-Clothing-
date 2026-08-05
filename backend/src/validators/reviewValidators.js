const { body, param } = require('express-validator');

const createReviewValidator = [
  body('product_id').isInt({ min: 1 }).withMessage('A valid product_id is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment is too long'),
  body('recommend').optional().isBoolean().withMessage('Recommend must be true or false'),
];

const updateReviewValidator = [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment is too long'),
  body('recommend').optional().isBoolean().withMessage('Recommend must be true or false'),
];

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid review id')];

module.exports = { createReviewValidator, updateReviewValidator, idParamValidator };

const { body } = require('express-validator');

const addToCartValidator = [
  body('product_id').isInt({ min: 1 }).withMessage('A valid product_id is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

const updateCartValidator = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

module.exports = { addToCartValidator, updateCartValidator };

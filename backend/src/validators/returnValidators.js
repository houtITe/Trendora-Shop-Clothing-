const { body } = require('express-validator');

const createReturnValidator = [
  body('order_id').isInt({ min: 1 }).withMessage('A valid order_id is required'),
  body('product_id').isInt({ min: 1 }).withMessage('A valid product_id is required'),
  body('quantity').isInt({ min: 1 }).withMessage('quantity must be at least 1'),
  body('type').optional().isIn(['return', 'exchange']).withMessage('type must be "return" or "exchange"'),
  body('reason').optional().trim(),
  body('exchange_product_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Invalid exchange_product_id'),
];

module.exports = { createReturnValidator };

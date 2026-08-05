const { body, param } = require('express-validator');

const createHeldOrderValidator = [
  body('items').isArray({ min: 1 }).withMessage('A held order must include at least one item'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Each item needs a valid product_id'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item needs a quantity of at least 1'),
  body('customerId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Invalid customerId'),
  body('customerName').optional().trim(),
  body('discountPct').optional().isFloat({ min: 0, max: 100 }).withMessage('discountPct must be between 0 and 100'),
];

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid held order id')];

module.exports = { createHeldOrderValidator, idParamValidator };

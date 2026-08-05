const { body, param } = require('express-validator');

const createOrderValidator = [
  body('items').isArray({ min: 1 }).withMessage('Order must include at least one item'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Each item needs a valid product_id'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item needs a quantity of at least 1'),
  body('shippingAddress').optional().trim().notEmpty().withMessage('Shipping address cannot be empty'),
  body('paymentMethod').optional().trim().notEmpty().withMessage('paymentMethod cannot be empty'),
  body('shippingFee').optional().isFloat({ min: 0 }).withMessage('shippingFee must be a non-negative number'),
];

const createPosSaleValidator = [
  body('items').isArray({ min: 1 }).withMessage('Sale must include at least one item'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Each item needs a valid product_id'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item needs a quantity of at least 1'),
  body('customerId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Invalid customerId'),
  body('paymentMethod').optional().trim().notEmpty().withMessage('paymentMethod cannot be empty'),
  body('discountPct').optional().isFloat({ min: 0, max: 100 }).withMessage('discountPct must be between 0 and 100'),
  body('taxPct').optional().isFloat({ min: 0, max: 100 }).withMessage('taxPct must be between 0 and 100'),
];

const updateStatusValidator = [
  body('status')
    .isIn(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Exchanged', 'Refunded'])
    .withMessage('Invalid order status'),
];

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid order id')];

module.exports = { createOrderValidator, createPosSaleValidator, updateStatusValidator, idParamValidator };

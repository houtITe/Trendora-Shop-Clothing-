const { body, param } = require('express-validator');

const createProductValidator = [
  body('product_name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
  body('category_id').isInt({ min: 1 }).withMessage('A valid category_id is required'),
  body('brand_id').isInt({ min: 1 }).withMessage('A valid brand_id is required'),
];

const updateProductValidator = [
  body('product_name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100'),
];

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid product id')];

module.exports = { createProductValidator, updateProductValidator, idParamValidator };

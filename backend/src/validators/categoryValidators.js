const { body, param } = require('express-validator');

const categoryValidator = [
  body('category_name').trim().notEmpty().withMessage('Category name is required'),
];

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid category id')];

module.exports = { categoryValidator, idParamValidator };

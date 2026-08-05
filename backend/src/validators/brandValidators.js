const { body, param } = require('express-validator');

const brandValidator = [
  body('brand_name').trim().notEmpty().withMessage('Brand name is required'),
];

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid brand id')];

module.exports = { brandValidator, idParamValidator };

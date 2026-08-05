const { body } = require('express-validator');

const wishlistValidator = [
  body('product_id').isInt({ min: 1 }).withMessage('A valid product_id is required'),
];

module.exports = { wishlistValidator };

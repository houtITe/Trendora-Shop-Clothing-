const { body, param } = require('express-validator');

const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
];

const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Must be a valid email').normalizeEmail(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['customer', 'staff', 'admin']).withMessage('Invalid role'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
];

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('Invalid user id')];

module.exports = { updateProfileValidator, createUserValidator, idParamValidator };

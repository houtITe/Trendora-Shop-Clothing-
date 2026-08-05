const { body } = require('express-validator');

const contactValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('subject').optional().trim(),
  body('message').trim().isLength({ min: 5 }).withMessage('Message must be at least 5 characters'),
];

module.exports = { contactValidator };

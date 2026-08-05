const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after an express-validator chain; turns collected errors into a
// consistent 422 ApiError instead of letting each controller check manually.
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.unprocessable('Validation failed', formatted));
}

module.exports = validateRequest;

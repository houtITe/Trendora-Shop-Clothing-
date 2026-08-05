const ApiError = require('../utils/ApiError');

// Centralized error handler — must be registered last, after all routes.
// Ensures the server never crashes on a thrown/rejected error and always
// responds with the project's standard { success, message, errors } shape.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    error = new ApiError(statusCode, error.message || 'Internal server error');
  }

  if (process.env.NODE_ENV !== 'production' && error.statusCode >= 500) {
    console.error(err);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
  });
}

module.exports = errorHandler;

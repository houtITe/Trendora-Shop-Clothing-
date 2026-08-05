const ApiError = require('../utils/ApiError');

// Registered after all routes but before errorHandler — catches any
// request that didn't match a known route.
function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;

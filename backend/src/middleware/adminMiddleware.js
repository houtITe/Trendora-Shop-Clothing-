const ApiError = require('../utils/ApiError');

// Must run AFTER authMiddleware — relies on req.user being populated.
function adminMiddleware(req, res, next) {
  if (!req.user) return next(ApiError.unauthorized('Authentication required.'));
  if (req.user.role !== 'admin') return next(ApiError.forbidden('Admin access required.'));
  next();
}

module.exports = adminMiddleware;

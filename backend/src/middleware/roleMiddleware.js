const ApiError = require('../utils/ApiError');

/**
 * Restricts a route to specific roles. Admin always passes — Admin is the
 * super-role with full access everywhere, same as the frontend's
 * ProtectedRoute.
 *   requireRole('staff')          // staff or admin
 *   requireRole('staff', 'admin') // same thing, explicit
 *
 * Must run AFTER authMiddleware — relies on req.user being populated.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required.'));
    if (req.user.role === 'admin' || roles.includes(req.user.role)) return next();
    return next(ApiError.forbidden('You do not have permission to do that.'));
  };
}

module.exports = requireRole;

const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/tokens');
const UserRepository = require('../repositories/UserRepository');

// Reads the JWT from the httpOnly cookie first, falling back to the
// Authorization: Bearer header (handy for non-browser API clients).
const authMiddleware = asyncHandler(async (req, res, next) => {
  const bearer = req.headers.authorization;
  const token =
    (req.cookies && req.cookies.accessToken) ||
    (bearer && bearer.startsWith('Bearer ') ? bearer.slice(7) : null);

  if (!token) throw ApiError.unauthorized('Authentication required. Please log in.');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired session. Please log in again.');
  }

  const user = await UserRepository.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists.');

  req.user = UserRepository.sanitize(user);
  next();
});

module.exports = authMiddleware;

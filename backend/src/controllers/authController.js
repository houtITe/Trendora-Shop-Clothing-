const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/authService');
const env = require('../config/env');

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000,
};

function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  setAuthCookies(res, { accessToken, refreshToken });
  return ApiResponse.created(res, { message: 'Account created successfully.', data: { user, accessToken } });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setAuthCookies(res, { accessToken, refreshToken });
  return ApiResponse.success(res, { message: 'Logged in successfully.', data: { user, accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  return ApiResponse.success(res, { message: 'Logged out successfully.' });
});

const me = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, { message: 'Current user', data: { user: req.user } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return ApiResponse.success(res, {
    message: result.message,
    data: result.resetToken ? { resetToken: result.resetToken } : undefined,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetPassword(token, newPassword);
  return ApiResponse.success(res, { message: result.message });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const { user, accessToken, refreshToken: newRefreshToken } = await authService.refreshSession(token);
  setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });
  return ApiResponse.success(res, { message: 'Session refreshed.', data: { user, accessToken } });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user.user_id, currentPassword, newPassword);
  return ApiResponse.success(res, { message: result.message });
});

module.exports = { register, login, logout, me, forgotPassword, resetPassword, changePassword, refresh };

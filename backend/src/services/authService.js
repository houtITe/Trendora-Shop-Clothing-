const ApiError = require('../utils/ApiError');
const UserRepository = require('../repositories/UserRepository');
const { hashPassword, comparePassword, isStrongPassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokens');
const { v4: uuidv4 } = require('uuid');

async function register({ name, email, password }) {
  const existing = await UserRepository.findByEmail(email);
  if (existing) throw ApiError.conflict('An account with this email already exists.');
  if (!isStrongPassword(password)) {
    throw ApiError.unprocessable('Password does not meet strength requirements.');
  }

  const hashed = await hashPassword(password);
  const user = await UserRepository.create({ name, email, password: hashed });
  return issueTokensFor(user);
}

async function login({ email, password }) {
  const user = await UserRepository.findByEmail(email);
  if (!user) throw ApiError.unauthorized('Invalid email or password.');

  const matches = await comparePassword(password, user.password);
  if (!matches) throw ApiError.unauthorized('Invalid email or password.');

  return issueTokensFor(user);
}

function issueTokensFor(user) {
  const payload = { sub: user.user_id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return { user: UserRepository.sanitize(user), accessToken, refreshToken };
}

async function forgotPassword(email) {
  const user = await UserRepository.findByEmail(email);
  // Always resolve the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  if (!user) return { message: 'If an account exists for that email, a reset link has been sent.' };

  const resetToken = uuidv4();
  const resetTokenExpiry = Date.now() + 1000 * 60 * 30; // 30 minutes
  await UserRepository.update(user.user_id, { resetToken, resetTokenExpiry });

  // TODO: send an actual email with a reset link containing `resetToken`.
  // Returning it here only because there's no email provider wired up yet.
  return { message: 'If an account exists for that email, a reset link has been sent.', resetToken };
}

async function resetPassword(token, newPassword) {
  if (!isStrongPassword(newPassword)) {
    throw ApiError.unprocessable('Password does not meet strength requirements.');
  }
  const users = await UserRepository.findAll();
  const user = users.find((u) => u.resetToken === token && u.resetTokenExpiry > Date.now());
  if (!user) throw ApiError.badRequest('Reset token is invalid or has expired.');

  const hashed = await hashPassword(newPassword);
  await UserRepository.update(user.user_id, { password: hashed, resetToken: null, resetTokenExpiry: null });
  return { message: 'Password has been reset successfully.' };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await UserRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found.');

  const matches = await comparePassword(currentPassword, user.password);
  if (!matches) throw ApiError.unauthorized('Current password is incorrect.');
  if (!isStrongPassword(newPassword)) {
    throw ApiError.unprocessable('Password does not meet strength requirements.');
  }

  const hashed = await hashPassword(newPassword);
  await UserRepository.update(userId, { password: hashed });
  return { message: 'Password changed successfully.' };
}

module.exports = { register, login, forgotPassword, resetPassword, changePassword, issueTokensFor };

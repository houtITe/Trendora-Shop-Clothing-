const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const UserRepository = require('../repositories/UserRepository');
const { hashPassword } = require('../utils/password');

async function getProfile(userId) {
  const user = await UserRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found.');
  return UserRepository.sanitize(user);
}

async function updateProfile(userId, changes) {
  // Password changes must go through /api/auth/change-password (verifies
  // the current password first) — never accept a raw password here.
  const { password, ...safeChanges } = changes;
  const user = await UserRepository.update(userId, safeChanges);
  if (!user) throw ApiError.notFound('User not found.');
  return UserRepository.sanitize(user);
}

async function deleteProfile(userId) {
  const removed = await UserRepository.remove(userId);
  if (!removed) throw ApiError.notFound('User not found.');
  return { message: 'Account deleted.' };
}

async function listUsers({ page, limit, offset }) {
  const [rows, total] = await Promise.all([
    UserRepository.findAll({ offset, limit }),
    UserRepository.count(),
  ]);
  return {
    items: rows.map(UserRepository.sanitize),
    meta: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
}

async function getUserById(id) {
  const user = await UserRepository.findById(id);
  if (!user) throw ApiError.notFound('User not found.');
  return UserRepository.sanitize(user);
}

async function adminUpdateUser(id, changes) {
  const payload = { ...changes };
  if (payload.password) payload.password = await hashPassword(payload.password);
  const user = await UserRepository.update(id, payload);
  if (!user) throw ApiError.notFound('User not found.');
  return UserRepository.sanitize(user);
}

async function adminDeleteUser(id) {
  const removed = await UserRepository.remove(id);
  if (!removed) throw ApiError.notFound('User not found.');
  return { message: 'User deleted.' };
}

async function searchCustomers(search) {
  const rows = await UserRepository.findCustomers(search);
  return rows.map(UserRepository.sanitize);
}

async function createUser(actorRole, data) {
  const isStaffActor = actorRole === 'staff';

  if (isStaffActor && data.role && data.role !== 'customer') {
    throw ApiError.forbidden('Staff can only create customer accounts.');
  }

  const email = data.email || `walkin-${Date.now()}@pos.local`;
  const existing = await UserRepository.findByEmail(email);
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  // A walk-in customer created from the POS doesn't need a real password —
  // generate one that satisfies the strength check so the hash is still valid.
  const rawPassword = data.password || `${crypto.randomBytes(6).toString('hex')}A1`;
  const hashed = await hashPassword(rawPassword);

  const user = await UserRepository.create({
    name: data.name,
    email,
    password: hashed,
    role: isStaffActor ? 'customer' : (data.role || 'customer'),
    phone: data.phone || null,
    address: data.address || null,
    walk_in: isStaffActor || !!data.walk_in,
  });

  return UserRepository.sanitize(user);
}

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
  listUsers,
  getUserById,
  searchCustomers,
  createUser,
  adminUpdateUser,
  adminDeleteUser,
};

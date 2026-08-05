const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const userService = require('../services/userService');
const { getPagination } = require('../utils/pagination');

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.user_id);
  return ApiResponse.success(res, { message: 'Profile fetched.', data: { user } });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.user_id, req.body);
  return ApiResponse.success(res, { message: 'Profile updated.', data: { user } });
});

const deleteMyProfile = asyncHandler(async (req, res) => {
  const result = await userService.deleteProfile(req.user.user_id);
  return ApiResponse.success(res, { message: result.message });
});

const listUsers = asyncHandler(async (req, res) => {
  const pageInfo = getPagination(req.query, { defaultLimit: 20 });
  const { items, meta } = await userService.listUsers(pageInfo);
  return ApiResponse.success(res, { message: 'Users fetched.', data: { users: items, meta } });
});

const searchCustomers = asyncHandler(async (req, res) => {
  const customers = await userService.searchCustomers(req.query.search);
  return ApiResponse.success(res, { message: 'Customers fetched.', data: { customers } });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.user.role, req.body);
  return ApiResponse.created(res, { message: 'User created.', data: { user } });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return ApiResponse.success(res, { message: 'User fetched.', data: { user } });
});

const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = await userService.adminUpdateUser(req.params.id, req.body);
  return ApiResponse.success(res, { message: 'User updated.', data: { user } });
});

const adminDeleteUser = asyncHandler(async (req, res) => {
  const result = await userService.adminDeleteUser(req.params.id);
  return ApiResponse.success(res, { message: result.message });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  deleteMyProfile,
  listUsers,
  searchCustomers,
  createUser,
  getUserById,
  adminUpdateUser,
  adminDeleteUser,
};

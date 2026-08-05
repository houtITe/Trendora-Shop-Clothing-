const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const orderService = require('../services/orderService');
const { getPagination } = require('../utils/pagination');

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.user_id, req.body);
  return ApiResponse.created(res, { message: 'Order placed successfully.', data: { order } });
});
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getUserOrders(req.user.user_id);
  return ApiResponse.success(res, { message: 'Orders fetched.', data: { orders } });
});
const createPosSale = asyncHandler(async (req, res) => {
  const { items, customerId, paymentMethod, discountPct, taxPct } = req.body;
  const order = await orderService.createPosSale(req.user.user_id, { items, customerId, paymentMethod, discountPct, taxPct });
  return ApiResponse.created(res, { message: 'Sale completed.', data: { order } });
});
const getMyPosSales = asyncHandler(async (req, res) => {
  const orders = await orderService.getCashierOrders(req.user.user_id);
  return ApiResponse.success(res, { message: 'POS sales fetched.', data: { orders } });
});
const getOrderDetails = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderWithDetails(req.params.id);
  const isStaffOrAdmin = req.user.role === 'admin' || req.user.role === 'staff';
  if (!isStaffOrAdmin && order.user_id !== req.user.user_id) {
    throw ApiError.forbidden('You do not have access to this order.');
  }
  return ApiResponse.success(res, { message: 'Order fetched.', data: { order } });
});
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user.user_id, req.params.id, req.user.role === 'admin');
  return ApiResponse.success(res, { message: 'Order cancelled.', data: { order } });
});
const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.body.status);
  return ApiResponse.success(res, { message: 'Order status updated.', data: { order } });
});
const listAllOrders = asyncHandler(async (req, res) => {
  const pageInfo = getPagination(req.query, { defaultLimit: 20 });
  const { items, meta } = await orderService.listAllOrders(pageInfo);
  return ApiResponse.success(res, { message: 'Orders fetched.', data: { orders: items, meta } });
});

module.exports = {
  createOrder,
  getMyOrders,
  createPosSale,
  getMyPosSales,
  getOrderDetails,
  cancelOrder,
  updateStatus,
  listAllOrders,
};

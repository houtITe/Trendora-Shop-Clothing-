const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const heldOrderService = require('../services/heldOrderService');

const holdOrder = asyncHandler(async (req, res) => {
  const held = await heldOrderService.holdOrder(req.user, req.body);
  return ApiResponse.created(res, { message: 'Order held.', data: { held } });
});

const listMine = asyncHandler(async (req, res) => {
  const held = await heldOrderService.listMine(req.user.user_id);
  return ApiResponse.success(res, { message: 'Held orders fetched.', data: { held } });
});

const resume = asyncHandler(async (req, res) => {
  const held = await heldOrderService.resume(req.params.id, req.user.user_id, req.user.role === 'admin');
  return ApiResponse.success(res, { message: 'Held order resumed.', data: { held } });
});

module.exports = { holdOrder, listMine, resume };

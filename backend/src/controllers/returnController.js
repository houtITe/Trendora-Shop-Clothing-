const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const returnService = require('../services/returnService');

const createReturn = asyncHandler(async (req, res) => {
  const record = await returnService.processReturn(req.user.user_id, req.body);
  return ApiResponse.created(res, { message: 'Return/exchange processed. Stock updated.', data: { return: record } });
});

const getByOrder = asyncHandler(async (req, res) => {
  const returns = await returnService.getByOrder(req.params.orderId);
  return ApiResponse.success(res, { message: 'Returns fetched.', data: { returns } });
});

const listRecent = asyncHandler(async (req, res) => {
  const returns = await returnService.listRecent(Number(req.query.limit) || 10);
  return ApiResponse.success(res, { message: 'Recent returns fetched.', data: { returns } });
});

module.exports = { createReturn, getByOrder, listRecent };

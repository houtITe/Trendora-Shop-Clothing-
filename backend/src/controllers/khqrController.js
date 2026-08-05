const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const khqrService = require('../services/khqrService');

const generate = asyncHandler(async (req, res) => {
  const { shippingFee } = req.body;
  const session = await khqrService.generateQr(req.user.user_id, shippingFee);
  return ApiResponse.success(res, { message: 'KHQR code generated.', data: session });
});

const status = asyncHandler(async (req, res) => {
  const result = await khqrService.checkStatus(req.user.user_id, req.params.md5);
  return ApiResponse.success(res, { message: 'Status checked.', data: result });
});

module.exports = { generate, status };

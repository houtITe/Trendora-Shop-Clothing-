const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const dashboardService = require('../services/dashboardService');

const getOverview = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getOverview();
  return ApiResponse.success(res, { message: 'Dashboard data fetched.', data: overview });
});

const getStaffOverview = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getStaffOverview(req.user.user_id);
  return ApiResponse.success(res, { message: 'Staff dashboard data fetched.', data: overview });
});

module.exports = { getOverview, getStaffOverview };

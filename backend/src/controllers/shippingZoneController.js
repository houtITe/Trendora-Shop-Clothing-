const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const shippingZoneService = require('../services/shippingZoneService');

const listActiveZones = asyncHandler(async (req, res) => {
  const zones = await shippingZoneService.getActiveZones();
  return ApiResponse.success(res, { message: 'Shipping zones fetched.', data: { zones } });
});

const listAllZonesAdmin = asyncHandler(async (req, res) => {
  const zones = await shippingZoneService.getAllZones();
  return ApiResponse.success(res, { message: 'All shipping zones fetched.', data: { zones } });
});

const getZone = asyncHandler(async (req, res) => {
  const zone = await shippingZoneService.getZoneById(req.params.id);
  return ApiResponse.success(res, { message: 'Shipping zone fetched.', data: { zone } });
});

const createZone = asyncHandler(async (req, res) => {
  const zone = await shippingZoneService.createZone(req.body);
  return ApiResponse.created(res, { message: 'Shipping zone created.', data: { zone } });
});

const updateZone = asyncHandler(async (req, res) => {
  const zone = await shippingZoneService.updateZone(req.params.id, req.body);
  return ApiResponse.success(res, { message: 'Shipping zone updated.', data: { zone } });
});

const deleteZone = asyncHandler(async (req, res) => {
  const result = await shippingZoneService.deleteZone(req.params.id);
  return ApiResponse.success(res, { message: result.message });
});

module.exports = {
  listActiveZones,
  listAllZonesAdmin,
  getZone,
  createZone,
  updateZone,
  deleteZone,
};

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const brandService = require('../services/brandService');

const listBrands = asyncHandler(async (req, res) => {
  const brands = await brandService.list();
  return ApiResponse.success(res, { message: 'Brands fetched.', data: { brands } });
});
const getBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.get(req.params.id);
  return ApiResponse.success(res, { message: 'Brand fetched.', data: { brand } });
});
const createBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.create(req.body);
  return ApiResponse.created(res, { message: 'Brand created.', data: { brand } });
});
const updateBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.update(req.params.id, req.body);
  return ApiResponse.success(res, { message: 'Brand updated.', data: { brand } });
});
const deleteBrand = asyncHandler(async (req, res) => {
  const result = await brandService.remove(req.params.id);
  return ApiResponse.success(res, { message: result.message });
});

module.exports = { listBrands, getBrand, createBrand, updateBrand, deleteBrand };

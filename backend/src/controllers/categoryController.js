const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const categoryService = require('../services/categoryService');

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.list();
  return ApiResponse.success(res, { message: 'Categories fetched.', data: { categories } });
});
const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.get(req.params.id);
  return ApiResponse.success(res, { message: 'Category fetched.', data: { category } });
});
const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.body);
  return ApiResponse.created(res, { message: 'Category created.', data: { category } });
});
const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body);
  return ApiResponse.success(res, { message: 'Category updated.', data: { category } });
});
const deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.remove(req.params.id);
  return ApiResponse.success(res, { message: result.message });
});

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };

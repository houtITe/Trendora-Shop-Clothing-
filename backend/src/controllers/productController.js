const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const productService = require('../services/productService');
const { getPagination } = require('../utils/pagination');

const listProducts = asyncHandler(async (req, res) => {
  const pageInfo = getPagination(req.query);
  const filters = {
    search: req.query.search,
    category_id: req.query.category_id,
    brand_id: req.query.brand_id,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    featured: req.query.featured,
    newArrivals: req.query.newArrivals,
    sort: req.query.sort,
  };
  const { items, meta } = await productService.listProducts(filters, pageInfo);
  return ApiResponse.success(res, { message: 'Products fetched.', data: { products: items, meta } });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.params.id);
  return ApiResponse.success(res, { message: 'Product fetched.', data: { product } });
});

const getByBarcode = asyncHandler(async (req, res) => {
  const product = await productService.getByBarcode(req.params.code);
  return ApiResponse.success(res, { message: 'Product fetched.', data: { product } });
});

const adjustStock = asyncHandler(async (req, res) => {
  const product = await productService.adjustStock(req.params.id, Number(req.body.delta));
  return ApiResponse.success(res, { message: 'Stock adjusted.', data: { product } });
});

const createProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.file) payload.image = `/uploads/products/${req.file.filename}`;
  const product = await productService.createProduct(payload);
  return ApiResponse.created(res, { message: 'Product created.', data: { product } });
});

const updateProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.file) payload.image = `/uploads/products/${req.file.filename}`;
  const product = await productService.updateProduct(req.params.id, payload);
  return ApiResponse.success(res, { message: 'Product updated.', data: { product } });
});

const getNextCodes = asyncHandler(async (req, res) => {
  const codes = await productService.getNextCodes();
  return ApiResponse.success(res, { message: 'Next codes generated.', data: codes });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  return ApiResponse.success(res, { message: result.message });
});

module.exports = { listProducts, getProduct, getByBarcode, getNextCodes, adjustStock, createProduct, updateProduct, deleteProduct };

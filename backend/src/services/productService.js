const ApiError = require('../utils/ApiError');
const ProductRepository = require('../repositories/ProductRepository');
const CategoryRepository = require('../repositories/CategoryRepository');
const BrandRepository = require('../repositories/BrandRepository');

async function listProducts(filters, { page, limit, offset }) {
  const [items, total] = await Promise.all([
    ProductRepository.findAll(filters, { offset, limit }),
    ProductRepository.countFiltered(filters),
  ]);
  return { items, meta: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) } };
}

async function getProduct(id) {
  const product = await ProductRepository.findById(id);
  if (!product) throw ApiError.notFound('Product not found.');
  return product;
}

async function getByBarcode(code) {
  const product = await ProductRepository.findByBarcode(code);
  if (!product) throw ApiError.notFound('No product for that barcode/SKU.');
  return product;
}

async function adjustStock(id, delta) {
  const product = await ProductRepository.findById(id);
  if (!product) throw ApiError.notFound('Product not found.');
  if (delta >= 0) return ProductRepository.incrementStock(id, delta);
  const updated = await ProductRepository.decrementStock(id, Math.abs(delta));
  if (!updated) throw ApiError.badRequest('Not enough stock for that adjustment.');
  return updated;
}

async function createProduct(data) {
  const [category, brand] = await Promise.all([
    CategoryRepository.findById(data.category_id),
    BrandRepository.findById(data.brand_id),
  ]);
  if (!category) throw ApiError.badRequest('category_id does not reference an existing category.');
  if (!brand) throw ApiError.badRequest('brand_id does not reference an existing brand.');
  return ProductRepository.create(data);
}

async function updateProduct(id, changes) {
  const product = await ProductRepository.update(id, changes);
  if (!product) throw ApiError.notFound('Product not found.');
  return product;
}

async function deleteProduct(id) {
  const removed = await ProductRepository.remove(id);
  if (!removed) throw ApiError.notFound('Product not found.');
  return { message: 'Product deleted.' };
}

module.exports = { listProducts, getProduct, getByBarcode, adjustStock, createProduct, updateProduct, deleteProduct };

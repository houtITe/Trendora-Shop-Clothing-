const ApiError = require('../utils/ApiError');
const BrandRepository = require('../repositories/BrandRepository');

async function list() {
  return BrandRepository.findAll();
}
async function get(id) {
  const brand = await BrandRepository.findById(id);
  if (!brand) throw ApiError.notFound('Brand not found.');
  return brand;
}
async function create(data) {
  return BrandRepository.create(data);
}
async function update(id, changes) {
  const brand = await BrandRepository.update(id, changes);
  if (!brand) throw ApiError.notFound('Brand not found.');
  return brand;
}
async function remove(id) {
  const removed = await BrandRepository.remove(id);
  if (!removed) throw ApiError.notFound('Brand not found.');
  return { message: 'Brand deleted.' };
}

module.exports = { list, get, create, update, remove };

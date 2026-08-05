const ApiError = require('../utils/ApiError');
const CategoryRepository = require('../repositories/CategoryRepository');

async function list() {
  return CategoryRepository.findAll();
}
async function get(id) {
  const category = await CategoryRepository.findById(id);
  if (!category) throw ApiError.notFound('Category not found.');
  return category;
}
async function create(data) {
  return CategoryRepository.create(data);
}
async function update(id, changes) {
  const category = await CategoryRepository.update(id, changes);
  if (!category) throw ApiError.notFound('Category not found.');
  return category;
}
async function remove(id) {
  const removed = await CategoryRepository.remove(id);
  if (!removed) throw ApiError.notFound('Category not found.');
  return { message: 'Category deleted.' };
}

module.exports = { list, get, create, update, remove };

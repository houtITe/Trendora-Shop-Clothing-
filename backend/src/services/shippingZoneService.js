const ApiError = require('../utils/ApiError');
const ShippingZoneRepository = require('../repositories/ShippingZoneRepository');

async function getActiveZones() {
  return ShippingZoneRepository.findAll({ activeOnly: true });
}

async function getAllZones() {
  return ShippingZoneRepository.findAll({ activeOnly: false });
}

async function getZoneById(id) {
  const zone = await ShippingZoneRepository.findById(id);
  if (!zone) throw ApiError.notFound('Shipping zone not found.');
  return zone;
}

async function createZone(data) {
  if (!data.zone_name) throw ApiError.badRequest('Zone name is required.');
  if (data.rate === undefined || Number(data.rate) < 0) {
    throw ApiError.badRequest('Valid delivery rate is required.');
  }
  return ShippingZoneRepository.create(data);
}

async function updateZone(id, changes) {
  const existing = await ShippingZoneRepository.findById(id);
  if (!existing) throw ApiError.notFound('Shipping zone not found.');
  return ShippingZoneRepository.update(id, changes);
}

async function deleteZone(id) {
  const removed = await ShippingZoneRepository.remove(id);
  if (!removed) throw ApiError.notFound('Shipping zone not found.');
  return { message: 'Shipping zone deleted successfully.' };
}

module.exports = {
  getActiveZones,
  getAllZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
};

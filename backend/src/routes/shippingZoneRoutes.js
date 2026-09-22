const express = require('express');
const shippingZoneController = require('../controllers/shippingZoneController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Public: customer checkout reads active distance zones
router.get('/', shippingZoneController.listActiveZones);

// Admin only: manage all shipping zones
router.get('/admin', authMiddleware, adminMiddleware, shippingZoneController.listAllZonesAdmin);
router.get('/:id', authMiddleware, adminMiddleware, shippingZoneController.getZone);
router.post('/', authMiddleware, adminMiddleware, shippingZoneController.createZone);
router.put('/:id', authMiddleware, adminMiddleware, shippingZoneController.updateZone);
router.delete('/:id', authMiddleware, adminMiddleware, shippingZoneController.deleteZone);

module.exports = router;

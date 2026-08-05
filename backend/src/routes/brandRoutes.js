const express = require('express');
const brandController = require('../controllers/brandController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { brandValidator, idParamValidator } = require('../validators/brandValidators');

const router = express.Router();

router.get('/', brandController.listBrands);
router.get('/:id', idParamValidator, validateRequest, brandController.getBrand);
router.post('/', authMiddleware, adminMiddleware, brandValidator, validateRequest, brandController.createBrand);
router.put('/:id', authMiddleware, adminMiddleware, idParamValidator, brandValidator, validateRequest, brandController.updateBrand);
router.delete('/:id', authMiddleware, adminMiddleware, idParamValidator, validateRequest, brandController.deleteBrand);

module.exports = router;

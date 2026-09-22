const express = require('express');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { uploadProductImage } = require('../middleware/uploadMiddleware');
const {
  createProductValidator,
  updateProductValidator,
  idParamValidator,
} = require('../validators/productValidators');

const router = express.Router();

router.get('/', productController.listProducts);
router.get('/barcode/:code', productController.getByBarcode); // POS barcode/SKU scan
router.get('/next-codes', authMiddleware, adminMiddleware, productController.getNextCodes);
router.get('/:id', idParamValidator, validateRequest, productController.getProduct);
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  uploadProductImage,
  createProductValidator,
  validateRequest,
  productController.createProduct
);
router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  uploadProductImage,
  idParamValidator,
  updateProductValidator,
  validateRequest,
  productController.updateProduct
);
// Staff can adjust stock (manual correction); full product edits stay Admin-only above.
router.patch('/:id/stock', authMiddleware, requireRole('staff'), idParamValidator, validateRequest, productController.adjustStock);
router.delete('/:id', authMiddleware, adminMiddleware, idParamValidator, validateRequest, productController.deleteProduct);

module.exports = router;

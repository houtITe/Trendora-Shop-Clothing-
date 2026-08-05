const express = require('express');
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { addToCartValidator, updateCartValidator } = require('../validators/cartValidators');

const router = express.Router();

router.use(authMiddleware);
router.get('/', cartController.getCart);
router.post('/', addToCartValidator, validateRequest, cartController.addItem);
router.put('/:productId', updateCartValidator, validateRequest, cartController.updateItem);
router.delete('/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;

const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { wishlistValidator } = require('../validators/wishlistValidators');

const router = express.Router();

router.use(authMiddleware);
router.get('/', wishlistController.getWishlist);
router.post('/', wishlistValidator, validateRequest, wishlistController.addItem);
router.delete('/:productId', wishlistController.removeItem);

module.exports = router;

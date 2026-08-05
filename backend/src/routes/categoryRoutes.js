const express = require('express');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { categoryValidator, idParamValidator } = require('../validators/categoryValidators');

const router = express.Router();

router.get('/', categoryController.listCategories);
router.get('/:id', idParamValidator, validateRequest, categoryController.getCategory);
router.post('/', authMiddleware, adminMiddleware, categoryValidator, validateRequest, categoryController.createCategory);
router.put('/:id', authMiddleware, adminMiddleware, idParamValidator, categoryValidator, validateRequest, categoryController.updateCategory);
router.delete('/:id', authMiddleware, adminMiddleware, idParamValidator, validateRequest, categoryController.deleteCategory);

module.exports = router;

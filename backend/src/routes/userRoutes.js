const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { updateProfileValidator, createUserValidator, idParamValidator } = require('../validators/userValidators');

const router = express.Router();

router.get('/profile', authMiddleware, userController.getMyProfile);
router.put('/profile', authMiddleware, updateProfileValidator, validateRequest, userController.updateMyProfile);
router.delete('/profile', authMiddleware, userController.deleteMyProfile);

// Staff + Admin: customer lookup for POS, and creating accounts.
// (Staff can only create walk-in customers — enforced in userService.createUser.)
router.get('/customers/search', authMiddleware, requireRole('staff'), userController.searchCustomers);
router.post('/', authMiddleware, requireRole('staff'), createUserValidator, validateRequest, userController.createUser);

// Admin only
router.get('/', authMiddleware, adminMiddleware, userController.listUsers);
router.get('/:id', authMiddleware, adminMiddleware, idParamValidator, validateRequest, userController.getUserById);
router.put('/:id', authMiddleware, adminMiddleware, idParamValidator, validateRequest, userController.adminUpdateUser);
router.delete('/:id', authMiddleware, adminMiddleware, idParamValidator, validateRequest, userController.adminDeleteUser);

module.exports = router;

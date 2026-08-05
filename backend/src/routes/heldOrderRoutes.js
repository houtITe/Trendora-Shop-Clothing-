const express = require('express');
const heldOrderController = require('../controllers/heldOrderController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { createHeldOrderValidator, idParamValidator } = require('../validators/heldOrderValidators');

const router = express.Router();

// Staff + Admin only — POS Hold / Continue Held Orders.
router.use(authMiddleware, requireRole('staff'));

router.get('/', heldOrderController.listMine);
router.post('/', createHeldOrderValidator, validateRequest, heldOrderController.holdOrder);
router.post('/:id/resume', idParamValidator, validateRequest, heldOrderController.resume);

module.exports = router;

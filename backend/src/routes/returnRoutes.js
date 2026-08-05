const express = require('express');
const returnController = require('../controllers/returnController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { createReturnValidator } = require('../validators/returnValidators');

const router = express.Router();

// Staff + Admin only — Returns & Exchanges is a POS/back-office feature.
router.use(authMiddleware, requireRole('staff'));

router.get('/', returnController.listRecent);
router.get('/order/:orderId', returnController.getByOrder);
router.post('/', createReturnValidator, validateRequest, returnController.createReturn);

module.exports = router;

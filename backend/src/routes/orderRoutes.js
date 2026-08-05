const express = require('express');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  createOrderValidator,
  createPosSaleValidator,
  updateStatusValidator,
  idParamValidator,
} = require('../validators/orderValidators');

const router = express.Router();

router.use(authMiddleware);

// Customer checkout (online)
router.post('/', createOrderValidator, validateRequest, orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);

// Staff POS checkout — Staff or Admin. Inventory is shared with online orders.
router.post('/pos', requireRole('staff'), createPosSaleValidator, validateRequest, orderController.createPosSale);
router.get('/pos/mine', requireRole('staff'), orderController.getMyPosSales);

router.get('/:id', idParamValidator, validateRequest, orderController.getOrderDetails);
router.put('/:id/cancel', idParamValidator, validateRequest, orderController.cancelOrder);

// Staff + Admin: full order list (Staff > Orders page). Status changes stay Admin-only.
router.get('/', requireRole('staff'), orderController.listAllOrders);
router.put('/:id/status', adminMiddleware, idParamValidator, updateStatusValidator, validateRequest, orderController.updateStatus);

module.exports = router;

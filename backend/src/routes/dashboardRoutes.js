const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', adminMiddleware, dashboardController.getOverview);
router.get('/staff', requireRole('staff'), dashboardController.getStaffOverview);

module.exports = router;

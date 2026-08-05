const express = require('express');
const khqrController = require('../controllers/khqrController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.post('/generate', khqrController.generate);
router.get('/status/:md5', khqrController.status);

module.exports = router;

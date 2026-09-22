const express = require('express');

const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/brands', require('./brandRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/khqr', require('./khqrRoutes'));
router.use('/wishlist', require('./wishlistRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/returns', require('./returnRoutes'));
router.use('/held-orders', require('./heldOrderRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/contact', require('./contactRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/shipping-zones', require('./shippingZoneRoutes'));

module.exports = router;

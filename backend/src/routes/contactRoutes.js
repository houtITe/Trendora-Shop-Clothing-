const express = require('express');
const contactController = require('../controllers/contactController');
const validateRequest = require('../middleware/validateRequest');
const { contactValidator } = require('../validators/contactValidators');

const router = express.Router();

router.post('/', contactValidator, validateRequest, contactController.submitContact);

module.exports = router;

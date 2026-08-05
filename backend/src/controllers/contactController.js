const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const contactService = require('../services/contactService');

const submitContact = asyncHandler(async (req, res) => {
  const message = await contactService.submit(req.body);
  return ApiResponse.created(res, { message: 'Your message has been sent. We will get back to you soon.', data: { message } });
});

module.exports = { submitContact };

const ContactRepository = require('../repositories/ContactRepository');

async function submit(data) {
  return ContactRepository.create(data);
}

module.exports = { submit };

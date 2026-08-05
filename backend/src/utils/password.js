const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

// Simple strength check: 8+ chars, at least one letter and one number.
function isStrongPassword(password) {
  return typeof password === 'string' && /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

module.exports = { hashPassword, comparePassword, isStrongPassword };

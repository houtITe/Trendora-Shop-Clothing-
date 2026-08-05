const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);
function makeStorage(subfolder) {
  const dir = path.join(__dirname, '..', 'uploads', subfolder);
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // multer doesn't create the destination folder for us — make sure it
      // exists before every write, so this never 500s with ENOENT again.
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(ApiError.badRequest('Only image uploads (jpeg, png, webp, avif, gif) are allowed.'));
  }
  cb(null, true);
}

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

const uploadProductImage = multer({ storage: makeStorage('products'), fileFilter, limits }).single('image');
const uploadAvatar = multer({ storage: makeStorage('avatars'), fileFilter, limits }).single('avatar');
const uploadReviewPhoto = multer({ storage: makeStorage('reviews'), fileFilter, limits }).single('photo');

module.exports = { uploadProductImage, uploadAvatar, uploadReviewPhoto };

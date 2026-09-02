const path = require('path');
const multer = require('multer');

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
];

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp'];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const mimeOk = ALLOWED_MIME.includes(file.mimetype);
    const extOk = ALLOWED_EXT.includes(ext);
    if (!mimeOk || !extOk) {
      const err = new Error('Invalid image file');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

module.exports = upload;
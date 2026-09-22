const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'];
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp'];

const VIDEO_MIME = [
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
  'video/webm',
  'video/x-msvideo',
  'video/mpeg',
  'video/3gpp',
  'video/3gpp2',
];
const VIDEO_EXT = ['.mp4', '.mov', '.m4v', '.webm', '.avi', '.mpeg', '.mpg', '.3gp', '.3g2'];

// Raw sources can be big, so files go to disk (not RAM) before being pushed to Cloudinary.
const UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'infilms-'));

// A 5-10 min phone/DSLR clip can be 1-4 GB before Cloudinary compresses it.
const MAX_VIDEO_BYTES = 4 * 1024 * 1024 * 1024;

function lowerExt(name) {
  return (path.extname(name) || '').toLowerCase();
}

function isImageFile(file) {
  return IMAGE_MIME.includes(file.mimetype) || IMAGE_EXT.includes(lowerExt(file.originalname));
}

function isVideoFile(file) {
  return VIDEO_MIME.includes(file.mimetype) || VIDEO_EXT.includes(lowerExt(file.originalname));
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + lowerExt(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_BYTES },
  fileFilter(req, file, cb) {
    if (isImageFile(file) || isVideoFile(file)) {
      return cb(null, true);
    }
    const err = new Error('Invalid file type. Supported types: JPEG, PNG, WebP, GIF, AVIF, BMP images and MP4, MOV, WebM, AVI video');
    err.status = 400;
    return cb(err);
  },
});

function removeUploaded(file) {
  if (file && file.path) {
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      // Ignore — temp cleanup is best-effort.
    }
  }
}

module.exports = { upload, isVideoFile, removeUploaded, MAX_VIDEO_BYTES };
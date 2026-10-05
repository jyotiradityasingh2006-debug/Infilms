const router = require('express').Router();
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const authenticate = require('../middleware/authMiddleware');
const { upload, isImageFile, removeUploaded } = require('../middleware/uploadMiddleware');
const {
  getHeroImages,
  saveHeroImages,
  addHeroImages,
  MAX_HERO_IMAGES,
} = require('../utils/store');

const HERO_FOLDER = 'hero';

// The hero is a full-bleed background, so cap the stored size while keeping
// enough resolution for large displays.
const HERO_TRANSFORM = [
  { width: 2400, height: 1600, crop: 'limit' },
  { quality: 'auto:good' },
  { fetch_format: 'auto' },
];

// Homepage (public) — the photos the hero heading cycles through.
router.get('/', async (req, res) => {
  try {
    res.json({ images: await getHeroImages(), max: MAX_HERO_IMAGES });
  } catch (err) {
    console.error('Failed to load hero images:', err.message);
    res.status(500).json({ message: 'Failed to load hero images' });
  }
});

// Upload one or more photos into the hero slideshow (admin). Extra uploads
// beyond MAX_HERO_IMAGES are dropped so the list never overflows.
router.post('/', authenticate, upload.array('images', MAX_HERO_IMAGES), async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  try {
    const images = files.filter(isImageFile);
    if (!images.length) {
      const err = new Error('Hero photos must be an image (JPEG, PNG, WebP, GIF, AVIF or BMP).');
      err.status = 400;
      throw err;
    }
    const uploaded = [];
    for (const file of images) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: HERO_FOLDER, resource_type: 'image', transformation: HERO_TRANSFORM },
          (err, r) => (err ? reject(err) : resolve(r)),
        );
        stream.end(fs.readFileSync(file.path));
      });
      uploaded.push({ url: result.secure_url || result.url, public_id: result.public_id });
    }
    const list = await addHeroImages(uploaded);
    res.status(201).json({ images: list, max: MAX_HERO_IMAGES, added: uploaded.length });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error('Hero upload failed:', err.message);
    res.status(status).json({ message: err.message || 'Hero upload to Cloudinary failed' });
  } finally {
    files.forEach(removeUploaded);
  }
});

// Replace the whole list — used by the admin panel to reorder or edit links.
router.put('/', authenticate, async (req, res) => {
  try {
    const incoming = req.body && Array.isArray(req.body.images) ? req.body.images : null;
    if (!incoming) {
      return res.status(400).json({ message: 'Send the hero photos as an array of image URLs' });
    }
    const list = await saveHeroImages(incoming);
    res.json({ images: list, max: MAX_HERO_IMAGES });
  } catch (err) {
    console.error('Failed to save hero images:', err.message);
    res.status(500).json({ message: 'Failed to save hero images' });
  }
});

// Remove one photo by index. Photos uploaded through this panel are also
// deleted from Cloudinary so they don't linger in the account.
router.delete('/:index', authenticate, async (req, res) => {
  try {
    const index = parseInt(req.params.index, 10);
    const current = await getHeroImages();
    if (!Number.isInteger(index) || index < 0 || index >= current.length) {
      return res.status(404).json({ message: 'Hero photo not found' });
    }
    const [removed] = current.splice(index, 1);
    const list = await saveHeroImages(current);

    const publicId = removed.public_id;
    if (publicId && publicId.startsWith(`${HERO_FOLDER}/`)) {
      await cloudinary.uploader
        .destroy(publicId, { resource_type: 'image' })
        .catch((err) => console.error('Could not delete hero image from Cloudinary:', err.message));
    }
    res.json({ images: list, max: MAX_HERO_IMAGES });
  } catch (err) {
    console.error('Failed to remove hero image:', err.message);
    res.status(500).json({ message: 'Failed to remove hero image' });
  }
});

module.exports = router;

const router = require('express').Router();
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const authenticate = require('../middleware/authMiddleware');
const { upload, isImageFile, removeUploaded } = require('../middleware/uploadMiddleware');
const { getSite, saveSite, DEFAULT_SITE, deepMerge } = require('../utils/store');

// Site photos live in their own folder so they never show up in the portfolio gallery.
const SITE_FOLDER = 'site-images';

// Homepage editable text (public)
router.get('/', async (req, res) => {
  try {
    const site = await getSite();
    res.json(deepMerge(DEFAULT_SITE, site));
  } catch (err) {
    console.error('Failed to load site content:', err.message);
    res.status(500).json({ message: 'Failed to load site content' });
  }
});

// Update homepage text (admin)
router.put('/', authenticate, async (req, res) => {
  try {
    const incoming = req.body && typeof req.body === 'object' ? req.body : {};
    const merged = deepMerge(DEFAULT_SITE, incoming);
    await saveSite(incoming);
    res.json(merged);
  } catch (err) {
    console.error('Failed to save site content:', err.message);
    res.status(500).json({ message: 'Failed to save site content' });
  }
});

// Upload one image for a content slot (hero/about photo). Admin only.
router.post('/upload-image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please choose an image file' });
    }
    if (!isImageFile(req.file)) {
      return res.status(400).json({ message: 'Only image files can be used for site photos' });
    }

    const buffer = fs.readFileSync(req.file.path);
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: SITE_FOLDER,
          resource_type: 'image',
          transformation: [
            { width: 2000, height: 2000, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        (err, r) => (err ? reject(err) : resolve(r)),
      );
      stream.end(buffer);
    });

    res.json({
      url: result.secure_url || result.url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (err) {
    console.error('Failed to upload site image:', err.message);
    res.status(500).json({ message: 'Upload failed — please try again' });
  } finally {
    removeUploaded(req.file);
  }
});

module.exports = router;
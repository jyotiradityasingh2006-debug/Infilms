const router = require('express').Router();
const cloudinary = require('../config/cloudinary');
const authenticate = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const FOLDER = 'portfolio';
const CATEGORIES = ['wedding', 'prewedding', 'engagement'];

function categoryFromPublicId(publicId) {
  const parts = (publicId || '').split('/');
  if (parts[0] === FOLDER && CATEGORIES.includes(parts[1])) {
    return parts[1];
  }
  return 'all';
}

router.get('/', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: `${FOLDER}/`,
      max_results: 500,
    });
    const photos = (result.resources || [])
      .map((r) => ({
        public_id: r.public_id,
        url: r.secure_url || r.url,
        width: r.width,
        height: r.height,
        format: r.format,
        category: categoryFromPublicId(r.public_id),
        created_at: r.created_at,
      }))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    res.json({ photos });
  } catch (err) {
    console.error('Failed to fetch photos:', err.message);
    res.status(500).json({ message: 'Failed to load photos from Cloudinary' });
  }
});

router.post(
  '/',
  authenticate,
  upload.single('image'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    try {
      const category = CATEGORIES.includes(req.body.category) ? req.body.category : null;
      const folder = category ? `${FOLDER}/${category}` : FOLDER;

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [
              { width: 2000, height: 2000, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
          },
          (err, r) => (err ? reject(err) : resolve(r)),
        );
        stream.end(req.file.buffer);
      });

      res.status(201).json({
        public_id: result.public_id,
        url: result.secure_url || result.url,
        width: result.width,
        height: result.height,
        format: result.format,
        category: categoryFromPublicId(result.public_id),
        created_at: result.created_at,
      });
    } catch (err) {
      console.error('Upload failed:', err.message);
      res.status(500).json({ message: 'Upload to Cloudinary failed' });
    }
  },
);

router.delete('/*splat', authenticate, async (req, res) => {
  try {
    let publicId = req.params.splat;
    if (Array.isArray(publicId)) {
      publicId = publicId.join('/');
    }
    if (!publicId || !publicId.startsWith(`${FOLDER}/`)) {
      return res.status(400).json({ message: 'Invalid public id' });
    }
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (result.result === 'not found') {
      return res.status(404).json({ message: 'Photo not found' });
    }
    if (result.result !== 'ok') {
      return res.status(500).json({ message: 'Failed to delete photo' });
    }
    res.json({ message: 'Photo deleted', public_id: publicId });
  } catch (err) {
    console.error('Delete failed:', err.message);
    res.status(500).json({ message: 'Failed to delete photo from Cloudinary' });
  }
});

module.exports = router;

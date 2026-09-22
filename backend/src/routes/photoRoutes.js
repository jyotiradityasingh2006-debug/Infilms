const router = require('express').Router();
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const authenticate = require('../middleware/authMiddleware');
const { upload, isVideoFile, removeUploaded } = require('../middleware/uploadMiddleware');
const {
  getCategories,
  addCustomerPhoto,
  removeCustomerPhotoByPublicId,
} = require('../utils/store');

const FOLDER = 'portfolio';
const VIDEO_FOLDER = 'portfolio/videos';

// Longest video allowed (in seconds) — max 10 minutes.
const MAX_VIDEO_SECONDS = 600;

async function categoryKeys() {
  const list = await getCategories();
  return list.map((c) => c.key).filter(Boolean);
}

function categoryFromPublicId(publicId, keys) {
  const parts = (publicId || '').split('/');
  if (parts[0] === FOLDER && keys.includes(parts[1])) {
    return parts[1];
  }
  return 'all';
}

// Incoming transformation: the compressed 720p ~2 Mbps version is what gets
// stored, so each film stays clear but takes a fraction of the original space.
const VIDEO_TRANSFORM =
  'w_1280,h_720,c_limit,vc_h264,ac_aac,br_2m,abr_128k,f_mp4';

router.get('/', async (req, res) => {
  try {
    const keys = await categoryKeys();
    const [imgResult, vidResult] = await Promise.all([
      cloudinary.api.resources({ type: 'upload', resource_type: 'image', prefix: `${FOLDER}/`, max_results: 500 })
        .catch(() => ({ resources: [] })),
      cloudinary.api.resources({ type: 'upload', resource_type: 'video', prefix: `${VIDEO_FOLDER}/`, max_results: 200 })
        .catch(() => ({ resources: [] })),
    ]);
    const photos = (imgResult.resources || [])
      .map((r) => ({
        type: 'image',
        public_id: r.public_id,
        url: r.secure_url || r.url,
        width: r.width,
        height: r.height,
        format: r.format,
        category: categoryFromPublicId(r.public_id, keys),
        created_at: r.created_at,
      }));
    const videos = (vidResult.resources || [])
      .map((r) => ({
        type: 'video',
        public_id: r.public_id,
        url: r.secure_url || r.url,
        width: r.width,
        height: r.height,
        format: r.format,
        duration: r.duration || 0,
        bytes: r.bytes || 0,
        category: 'all',
        created_at: r.created_at,
      }));
    const all = photos
      .concat(videos)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    res.json({ photos: all });
  } catch (err) {
    console.error('Failed to fetch media:', err.message);
    res.status(500).json({ message: 'Failed to load portfolio from Cloudinary' });
  }
});

async function uploadImage(req, res) {
  const imageBuffer = fs.readFileSync(req.file.path);
  const keys = await categoryKeys();
  const category = keys.includes(req.body.category) ? req.body.category : null;
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
    stream.end(imageBuffer);
  });

  const photo = {
    type: 'image',
    public_id: result.public_id,
    url: result.secure_url || result.url,
    width: result.width,
    height: result.height,
    format: result.format,
    category: categoryFromPublicId(result.public_id, keys),
    created_at: result.created_at,
  };

  const customer = (req.body && req.body.customer || '').trim().toLowerCase();
  if (customer) {
    await addCustomerPhoto(customer, photo);
  }

  return photo;
}

async function uploadVideo(req, res) {
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      req.file.path,
      {
        folder: VIDEO_FOLDER,
        resource_type: 'video',
        chunk_size: 6000000,
        transformation: VIDEO_TRANSFORM,
      },
      (err, r) => (err ? reject(err) : resolve(r)),
    );
  });

  const duration = Number(result.duration) || 0;
  if (duration > MAX_VIDEO_SECONDS) {
    await cloudinary.uploader
      .destroy(result.public_id, { resource_type: 'video' })
      .catch(() => {});
    const err = new Error(`Video is longer than ${Math.round(duration / 60)} min — the limit is ${MAX_VIDEO_SECONDS / 60} minutes.`);
    err.status = 400;
    throw err;
  }

  return {
    type: 'video',
    public_id: result.public_id,
    url: result.secure_url || result.url,
    width: result.width,
    height: result.height,
    format: result.format || 'mp4',
    duration,
    bytes: result.bytes || 0,
    category: 'all',
    created_at: result.created_at,
  };
}

// Upload a photo or video (admin). Videos are compressed on Cloudinary to
// 720p ~2 Mbps so a 5-10 minute film stays clear but uses little storage.
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }
  try {
    const isVideo = isVideoFile(req.file);
    const media = isVideo ? await uploadVideo(req, res) : await uploadImage(req, res);
    res.status(201).json(media);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error('Upload failed:', err.message);
    res.status(status).json({ message: err.message || 'Upload to Cloudinary failed' });
  } finally {
    removeUploaded(req.file);
  }
});

router.delete('/*splat', authenticate, async (req, res) => {
  try {
    let publicId = req.params.splat;
    if (Array.isArray(publicId)) {
      publicId = publicId.join('/');
    }
    if (!publicId || !publicId.startsWith(`${FOLDER}/`)) {
      return res.status(400).json({ message: 'Invalid public id' });
    }
    const resourceType = publicId.startsWith(`${VIDEO_FOLDER}/`) ? 'video' : 'image';
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    if (result.result === 'not found') {
      return res.status(404).json({ message: 'Media not found' });
    }
    if (result.result !== 'ok') {
      return res.status(500).json({ message: 'Failed to delete media' });
    }
    await removeCustomerPhotoByPublicId(publicId);
    res.json({ message: 'Media deleted', public_id: publicId });
  } catch (err) {
    console.error('Delete failed:', err.message);
    res.status(500).json({ message: 'Failed to delete media from Cloudinary' });
  }
});

module.exports = router;
const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const { getSite, saveSite, DEFAULT_SITE, deepMerge } = require('../utils/store');

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

module.exports = router;
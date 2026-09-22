const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getComments,
  getCommentsWithEmail,
  addComment,
  setCommentFeatured,
  deleteComment,
  getCustomerPhotosMap,
  getAppointments,
  normalizeEmail,
} = require('../utils/store');

const MAX_FEATURED = 3;

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// All testimonials (public). Each testimonial is matched against the
// customer's photos (by email) and their appointment so the portraits
// and booking linked to that testimonial can be shown alongside it.
router.get('/', async (req, res) => {
  try {
    const [comments, customerPhotos, appointments] = await Promise.all([
      getCommentsWithEmail(),
      getCustomerPhotosMap(),
      getAppointments(),
    ]);
    const list = comments.map((c) => {
      const email = normalizeEmail(c.email);
      const appointment = email
        ? appointments.find((a) => normalizeEmail(a.email) === email)
        : appointments.find((a) =>
            String(a.name || '').trim().toLowerCase() === String(c.name || '').trim().toLowerCase());
      return {
        id: c.id,
        name: c.name,
        text: c.text,
        location: c.location || '',
        featured: !!c.featured,
        createdAt: c.createdAt,
        photos: (customerPhotos[email] || []).map((p) => ({
          public_id: p.public_id,
          url: p.url,
          category: p.category || '',
        })),
        appointment: appointment
          ? {
              name: appointment.name,
              location: appointment.location || '',
              dateFrom: appointment.dateFrom || '',
              dateTo: appointment.dateTo || '',
            }
          : null,
      };
    });
    res.json({ comments: list });
  } catch (err) {
    console.error('Failed to load comments:', err.message);
    res.status(500).json({ message: 'Failed to load testimonials' });
  }
});

// Only the featured ones for the homepage
router.get('/featured', async (req, res) => {
  try {
    const comments = await getComments();
    const list = comments
      .filter((c) => c.featured)
      .slice(0, MAX_FEATURED);
    res.json({ comments: list });
  } catch (err) {
    console.error('Failed to load featured comments:', err.message);
    res.status(500).json({ message: 'Failed to load testimonials' });
  }
});

// Submit a new testimonial (public)
router.post('/', async (req, res) => {
  try {
    const name = (req.body && req.body.name || '').trim();
    const text = (req.body && req.body.text || '').trim();
    const location = (req.body && req.body.location || '').trim();
    const email = (req.body && req.body.email || '').trim().toLowerCase();
    if (!name || !text) {
      return res.status(400).json({ message: 'Name and testimonial are required' });
    }
    if (name.length > 80 || text.length > 2000 || location.length > 120 || email.length > 120) {
      return res.status(400).json({ message: 'Testimonial too long' });
    }
    const comment = {
      id: newId(),
      name,
      text,
      location,
      email,
      featured: false,
      createdAt: new Date().toISOString(),
    };
    const saved = await addComment(comment);
    res.status(201).json(saved);
  } catch (err) {
    console.error('Failed to save comment:', err.message);
    res.status(500).json({ message: 'Failed to save testimonial' });
  }
});

// Toggle "show on homepage" (admin)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const featured = !!(req.body && req.body.featured);
    if (featured) {
      const comments = await getComments();
      const currentlyFeatured = comments.filter((c) => c.featured && String(c.id) !== String(req.params.id)).length;
      if (currentlyFeatured >= MAX_FEATURED) {
        return res.status(400).json({ message: `Only ${MAX_FEATURED} testimonials can be shown on the homepage.` });
      }
    }
    const updated = await setCommentFeatured(req.params.id, featured);
    if (!updated) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Failed to update comment:', err.message);
    res.status(500).json({ message: 'Failed to update testimonial' });
  }
});

// Delete (admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const removed = await deleteComment(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }
    res.json({ message: 'Testimonial deleted', id: req.params.id });
  } catch (err) {
    console.error('Failed to delete comment:', err.message);
    res.status(500).json({ message: 'Failed to delete testimonial' });
  }
});

module.exports = router;
const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getComments,
  getAppointments,
  addAppointment,
  deleteAppointment,
  getCustomerPhotosMap,
  normalizeEmail,
} = require('../utils/store');

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function normalizeAppointment(a) {
  return {
    id: a.id,
    name: a.name,
    phone: a.phone || '',
    email: a.email || '',
    location: a.location || '',
    dateFrom: a.dateFrom || '',
    dateTo: a.dateTo || '',
    description: a.description || '',
    createdAt: a.createdAt,
  };
}

function findTestimonial(appointment, comments) {
  const email = normalizeEmail(appointment.email);
  if (email) {
    const byEmail = comments.find((c) => normalizeEmail(c.email) === email);
    if (byEmail) return byEmail;
  }
  const byName = comments.find((c) => String(c.name || '').trim().toLowerCase() === String(appointment.name || '').trim().toLowerCase());
  return byName || null;
}

function validPhone(value) {
  if (!value) return false;
  const digits = value.replace(/[^\d]/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

// All appointments (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    const [appointments, customerPhotos, comments] = await Promise.all([
      getAppointments(),
      getCustomerPhotosMap(),
      getComments(),
    ]);
    const list = appointments.map((a) => {
      const enriched = normalizeAppointment(a);
      const photos = customerPhotos[normalizeEmail(a.email)] || [];
      enriched.photos = photos.map((p) => ({
        public_id: p.public_id,
        url: p.url,
        category: p.category || '',
        created_at: p.created_at,
      }));
      const testimonial = findTestimonial(a, comments);
      enriched.testimonial = testimonial
        ? {
            name: testimonial.name,
            text: testimonial.text,
            location: testimonial.location || '',
            createdAt: testimonial.createdAt,
          }
        : null;
      return enriched;
    });
    res.json({ appointments: list });
  } catch (err) {
    console.error('Failed to load appointments:', err.message);
    res.status(500).json({ message: 'Failed to load appointments' });
  }
});

// Book a new appointment (public)
router.post('/', async (req, res) => {
  try {
    const name = (req.body && req.body.name || '').trim();
    const phone = (req.body && req.body.phone || '').trim();
    const email = (req.body && req.body.email || '').trim();
    const location = (req.body && req.body.location || '').trim();
    const dateFrom = (req.body && req.body.dateFrom || '').trim();
    const dateTo = (req.body && req.body.dateTo || '').trim();
    const description = (req.body && req.body.description || '').trim();
    if (!name || !phone || !email || !dateFrom || !dateTo) {
      return res.status(400).json({ message: 'Name, phone number, email and preferred dates are required' });
    }
    if (!validPhone(phone)) {
      return res.status(400).json({ message: 'Please enter a valid phone number (10-15 digits)' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (String(dateTo).localeCompare(String(dateFrom)) < 0) {
      return res.status(400).json({ message: '"To" date must be the same as or after the "from" date' });
    }
    if (name.length > 80 || phone.length > 20 || email.length > 120 || location.length > 120 || dateFrom.length > 20 || dateTo.length > 20 || description.length > 2000) {
      return res.status(400).json({ message: 'Appointment details too long' });
    }
    const appointment = {
      id: newId(),
      name,
      phone,
      email: normalizeEmail(email),
      location,
      dateFrom,
      dateTo,
      description,
      createdAt: new Date().toISOString(),
    };
    const saved = await addAppointment(appointment);
    res.status(201).json(saved);
  } catch (err) {
    console.error('Failed to save appointment:', err.message);
    res.status(500).json({ message: 'Failed to save appointment' });
  }
});

// Delete an appointment (admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const removed = await deleteAppointment(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted', id: req.params.id });
  } catch (err) {
    console.error('Failed to delete appointment:', err.message);
    res.status(500).json({ message: 'Failed to delete appointment' });
  }
});

module.exports = router;
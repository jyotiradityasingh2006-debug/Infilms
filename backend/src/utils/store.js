const fs = require('fs');
const path = require('path');
const { coll } = require('../db');

const LEGACY_DB_FILE = path.join(__dirname, '..', '..', 'data', 'db.json');

const SEED_COMMENTS = [
  {
    name: 'Aditi & Rohan',
    location: 'Rewa, Madhya Pradesh',
    text: 'They disappeared into the background so completely that half our guests didn\'t realise they were being filmed — and the film still caught everything.',
    featured: true,
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  {
    name: 'Priya & Karan',
    location: 'Indore, Madhya Pradesh',
    text: 'We\'re not photogenic people and they still made the pre-wedding shoot feel easy. The reel they cut got more replies than our actual invite.',
    featured: true,
    createdAt: '2026-01-20T10:00:00.000Z',
  },
  {
    name: 'Simran & Gurpreet',
    location: 'Punjab',
    text: 'Travelling with a full crew to Punjab sounded stressful, but the whole thing ran quietly and on time. The film arrived faster than we expected.',
    featured: true,
    createdAt: '2026-02-01T10:00:00.000Z',
  },
];

const DEFAULT_SITE = {
  nav: {
    home: 'Home',
    about: 'About',
    portfolio: 'Portfolio',
    films: 'Cinematic Films',
    packages: 'Packages',
    testimonials: 'Testimonials',
    contact: 'Contact',
  },
  hero: {
    tag: 'Wedding Photography & Cinematography · Rewa, MP',
    heading1: 'Stories',
    heading2: 'Worth Replaying',
    sub: 'In Films turns your wedding day into a cinematic film and a lifetime of photographs — shot with intention, edited with restraint, remembered forever.',
    locations: 'Based in Rewa · Shooting across Indore · Mumbai · Punjab · & beyond',
    cta1: 'Book Your Date',
    cta2: 'Watch Our Films',
  },
  about: {
    label: 'Scene 01 — The Studio',
    heading: 'A Rewa-based crew, chasing weddings across India',
    lede: 'In Films is a wedding photography and cinematography studio based in Rewa, Madhya Pradesh, serving couples across the country.',
    p1: 'We specialise in timeless photographs and cinematic wedding films that capture genuine emotion over posed perfection — the shaky laugh during the vows, the father\'s hand on his daughter\'s shoulder, the first look no one rehearsed.',
    p2: 'Every frame is shot on professional Lumix cameras and cut together with the same patience a film editor gives a feature — because a wedding, like a film, deserves a real edit, not a template.',
    statNum: '3',
    statLabel: 'States Covered This Season',
    why: [
      'Experienced wedding crew',
      'Cinematic storytelling',
      'High-end Lumix cameras',
      'Destination wedding coverage',
      'Fast, dependable delivery',
      'Personalised planning',
    ],
  },
  services: {
    label: 'Scene 02 — What We Shoot',
    heading: 'Coverage for every chapter of the wedding',
    text: 'From the first haldi splash to the last dance, In Films builds a coverage plan around how your two families actually celebrate.',
    items: [
      { title: 'Wedding Photography', text: 'Full-day documentation of every ceremony, in natural light and natural colour.' },
      { title: 'Wedding Cinematography', text: 'A cinematic film of your wedding, cut like a short story with a beginning and an end.' },
      { title: 'Pre-Wedding Shoots', text: 'Location-led shoots designed around you as a couple, not a template pose list.' },
      { title: 'Engagement Photography', text: 'Relaxed, candid coverage of the ring ceremony and the moments around it.' },
      { title: 'Candid Photography', text: 'Unposed, in-between moments shot quietly from the edge of the room.' },
      { title: 'Traditional Photography', text: 'Classic, well-lit ceremony and family portraits for the album your parents will keep.' },
      { title: 'Bridal & Groom Portraits', text: 'Dedicated portrait sessions that give the day\'s main characters their close-up.' },
      { title: 'Wedding Reels', text: 'Short, shareable highlight reels cut for Instagram, ready within days.' },
      { title: 'Event & Product Coverage', text: 'Sangeet, receptions and jewellery or product shoots, covered with the same eye.' },
    ],
  },
  equipment: {
    label: 'Scene 03 — Behind the Lens',
    heading: 'Shot on professional Panasonic Lumix bodies',
    items: [
      { name: 'Panasonic Lumix S1', tag: 'Full-Frame Cinema' },
      { name: 'Panasonic Lumix S1R', tag: 'High-Res Portraits' },
      { name: 'Panasonic Lumix S5IIX', tag: 'Hybrid Video Body' },
    ],
  },
  films: {
    label: 'Scene 04 — Cinematic Films',
    heading: 'Wedding films, cut like short stories',
    text: 'Every wedding gets a highlight film with its own pace and score — not a stock template stretched over your footage. Full films are linked on our YouTube channel.',
    cta: 'See Full Films on YouTube',
  },
  packages: {
    label: 'Scene 05 — Packages',
    heading: 'Coverage built around your wedding, not a price list',
    text: 'Every wedding is different, so every quote is custom — these three starting points show how coverage typically scales. Reach out for exact pricing.',
    cards: [
      {
        name: 'Essential',
        badge: '',
        sub: 'Single-Day Coverage',
        bullets: [
          'One-day photography',
          'Candid + traditional coverage',
          'Edited high-resolution photos',
          'Instagram-ready reel',
        ],
        cta: 'Enquire',
      },
      {
        name: 'Signature',
        badge: 'Most Booked',
        sub: 'Full Wedding Film + Photos',
        bullets: [
          'Multi-day photo + film coverage',
          'Cinematic wedding film',
          'Candid, traditional & portrait sets',
          'Highlight reel + full film',
          'Priority delivery',
        ],
        cta: 'Enquire',
      },
      {
        name: 'Destination',
        badge: '',
        sub: 'Travel & Multi-Event',
        bullets: [
          'Coverage outside Madhya Pradesh',
          'Pre-wedding + wedding + reception',
          'Full crew travel included',
          'Complete cinematic film',
        ],
        cta: 'Enquire',
      },
    ],
    note: 'Jewellery/product shoots and album printing available on request.',
  },
  testimonials: {
    label: 'Scene 06 — Testimonials',
    heading: 'In the couples\' own words',
    seeAll: 'See All Testimonials',
    formTitle: 'Shared your wedding with us? Write a testimonial',
  },
  contact: {
    label: 'Scene 07 — Get In Touch',
    heading: 'Let\'s talk about your wedding date',
    text: 'Tell us your date and city and we\'ll walk you through coverage options — most couples hear back within a day.',
    ig: 'DM us @infilms9862',
    yt: 'Watch us on YouTube',
    location: 'Rewa, Madhya Pradesh, India',
    address: 'In Films Studio\nRewa, Madhya Pradesh 486001, India',
    directions: 'Get Directions',
  },
  footer: {
    tagline: 'Wedding photography & cinematography, based in Rewa — shooting across India.',
    ig: 'IG',
    yt: 'YT',
    copyright: '© 2026 In Films. All rights reserved.',
    cities: 'Rewa · Indore · Mumbai · Punjab',
  },
  portfolio: {
    hero1: 'Recent',
    hero2: 'Frames',
    heroText: 'A mix of weddings, pre-wedding shoots and engagements from real couples across India.',
    galleryLabel: 'The Gallery',
    galleryHeading: 'Browse by category',
    galleryText: 'Filter by category to see how each kind of shoot is treated differently.',
    filterAll: 'All',
    filterWedding: 'Weddings',
    filterPre: 'Pre-Wedding',
    filterEng: 'Engagement',
    moreLabel: 'Full Gallery',
    moreHeading: 'Want to see more?',
    moreText: 'Browse the complete collection of our recent work — full albums from weddings, pre-weddings and engagements.',
    moreCta: 'Tap to See More →',
  },
  comments: {
    hero1: 'In their',
    hero2: 'Own Words',
    heroText: 'Every testimonial here is from a real couple. Read the full list — and if we shot your wedding, add your own.',
    writeLabel: 'Add Your Testimonial',
    writeHeading: 'Shared your big day with us?',
    writeText: 'Tell others what it was like. It takes a minute.',
    nameLabel: 'Your name',
    namePlaceholder: 'e.g. Aditi Sharma',
    emailLabel: 'Email (for your testimonial)',
    emailPlaceholder: 'e.g. you@example.com',
    locationLabel: 'City / location',
    locationPlaceholder: 'e.g. Rewa, Madhya Pradesh',
    textLabel: 'Your testimonial',
    textPlaceholder: 'What was your experience like?',
    submitBtn: 'Submit Testimonial',
    allLabel: 'All Testimonials',
    allHeading: 'What couples say',
  },
  booking: {
    label: 'Book Your Shoot',
    heading: 'Reserve your date',
    text: 'Tell us when you need us and a little about the day — we\'ll confirm availability and lock in your date.',
    nameLabel: 'Your name',
    namePlaceholder: 'e.g. Aditi Sharma',
    phoneLabel: 'Phone number',
    phonePlaceholder: 'e.g. +91 98765 43210',
    emailLabel: 'Email (so we can find you)',
    emailPlaceholder: 'e.g. you@example.com',
    locationLabel: 'City / location',
    locationPlaceholder: 'e.g. Rewa, Madhya Pradesh',
    dateFromLabel: 'Preferred photoshoot — from',
    dateToLabel: 'to',
    descLabel: 'What do you need?',
    descPlaceholder: 'A short note about your wedding or shoot...',
    submitBtn: 'Book Appointment',
  },
};

const DEFAULT_CATEGORIES = [
  { key: 'wedding', name: 'Weddings' },
  { key: 'prewedding', name: 'Pre-Wedding' },
  { key: 'engagement', name: 'Engagement' },
];

function clone(obj) {
  return obj == null ? obj : JSON.parse(JSON.stringify(obj));
}

// Deep-merge `over` on top of `base` so that any key the stored data is missing
// keeps its default value. Arrays are replaced wholesale when present.
function deepMerge(base, over) {
  if (over === undefined) return clone(base);
  if (Array.isArray(base) || Array.isArray(over)) return clone(over);
  if (base && typeof base === 'object' && over && typeof over === 'object') {
    const out = {};
    Object.keys(base).forEach((k) => {
      out[k] = deepMerge(base[k], over[k]);
    });
    Object.keys(over).forEach((k) => {
      if (!Object.prototype.hasOwnProperty.call(out, k) || over[k] === undefined) out[k] = clone(over[k]);
    });
    return out;
  }
  return clone(over);
}

// One-time migrate from the old file-based store (backend/data/db.json) so any
// data collected before this switch gets carried across. Returns null when absent.
function readLegacyDb() {
  try {
    if (!fs.existsSync(LEGACY_DB_FILE)) return null;
    return JSON.parse(fs.readFileSync(LEGACY_DB_FILE, 'utf8'));
  } catch (err) {
    return null;
  }
}

function isLegacyEmpty(list) {
  return !list || (Array.isArray(list) && list.length === 0);
}

async function ensureDefaults() {
  const legacy = readLegacyDb();

  await coll('site').updateOne(
    { _id: 'main' },
    { $setOnInsert: legacy && legacy.site && typeof legacy.site === 'object' ? legacy.site : clone(DEFAULT_SITE) },
    { upsert: true },
  );

  const categoryList = legacy && Array.isArray(legacy.categories) && legacy.categories.length
    ? legacy.categories.map((c) => ({ key: c.key, name: c.name }))
    : DEFAULT_CATEGORIES;
  const categoriesDoc = await coll('categories').findOne({ _id: 'main' });
  if (!categoriesDoc) {
    await coll('categories').insertOne({ _id: 'main', list: categoryList });
  }

  const commentCount = await coll('comments').countDocuments();
  if (commentCount === 0) {
    const source = legacy && Array.isArray(legacy.comments) && legacy.comments.length ? legacy.comments : SEED_COMMENTS;
    const docs = source.map((c) => ({
      _id: String(c.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8))),
      name: c.name,
      text: c.text,
      location: c.location || '',
      email: c.email || '',
      featured: !!c.featured,
      createdAt: c.createdAt || new Date().toISOString(),
    }));
    if (docs.length) await coll('comments').insertMany(docs);
  }

  const apptCount = await coll('appointments').countDocuments();
  if (apptCount === 0 && legacy && Array.isArray(legacy.appointments)) {
    const docs = legacy.appointments.map((a) => ({
      _id: String(a.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8))),
      name: a.name,
      phone: a.phone || '',
      email: a.email || '',
      location: a.location || '',
      dateFrom: a.dateFrom || '',
      dateTo: a.dateTo || '',
      description: a.description || '',
      createdAt: a.createdAt,
    }));
    if (docs.length) await coll('appointments').insertMany(docs);
  }

  if (legacy && legacy.customerPhotos && typeof legacy.customerPhotos === 'object') {
    const existing = await coll('customerphotos').countDocuments();
    if (existing === 0) {
      const docs = Object.keys(legacy.customerPhotos)
        .filter((email) => Array.isArray(legacy.customerPhotos[email]) && legacy.customerPhotos[email].length)
        .map((email) => ({ _id: email, photos: legacy.customerPhotos[email] }));
      if (docs.length) await coll('customerphotos').insertMany(docs);
    }
  }

  if (legacy && typeof legacy.adminPasswordHash === 'string' && legacy.adminPasswordHash && !(await coll('admin').findOne({ _id: 'admin' }))) {
    await coll('admin').insertOne({ _id: 'admin', passwordHash: legacy.adminPasswordHash });
  }
}

// ---------- comments ----------

function normalizeComment(c) {
  return {
    id: c._id,
    name: c.name,
    text: c.text,
    location: c.location || '',
    featured: !!c.featured,
    createdAt: c.createdAt,
  };
}

async function getComments() {
  const docs = await coll('comments').find().sort({ createdAt: -1 }).toArray();
  return docs.map(normalizeComment);
}

async function addComment(comment) {
  await coll('comments').insertOne({
    _id: comment.id,
    name: comment.name,
    text: comment.text,
    location: comment.location || '',
    email: comment.email || '',
    featured: !!comment.featured,
    createdAt: comment.createdAt,
  });
  return normalizeComment({ ...comment, _id: comment.id });
}

// Like getComments, but also returns the customer email so routes can match
// a testimonial against its customer's photos and appointment. The email is
// matched server-side only and must not be sent back to the public.
async function getCommentsWithEmail() {
  const docs = await coll('comments').find().sort({ createdAt: -1 }).toArray();
  return docs.map((c) => Object.assign(normalizeComment(c), { email: c.email || '' }));
}

async function setCommentFeatured(id, featured) {
  const doc = await coll('comments').findOneAndUpdate(
    { _id: id },
    { $set: { featured } },
    { returnDocument: 'after' },
  );
  return doc.value ? normalizeComment(doc.value) : null;
}

async function deleteComment(id) {
  const res = await coll('comments').deleteOne({ _id: id });
  return res.deletedCount > 0;
}

// ---------- appointments ----------

function normalizeAppointment(a) {
  return {
    id: a._id,
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

function normalizeEmail(value) {
  return (value || '').trim().toLowerCase();
}

async function getAppointments() {
  const docs = await coll('appointments').find().sort({ createdAt: -1 }).toArray();
  return docs.map(normalizeAppointment);
}

async function addAppointment(appointment) {
  await coll('appointments').insertOne({
    _id: appointment.id,
    name: appointment.name,
    phone: appointment.phone || '',
    email: appointment.email || '',
    location: appointment.location || '',
    dateFrom: appointment.dateFrom || '',
    dateTo: appointment.dateTo || '',
    description: appointment.description || '',
    createdAt: appointment.createdAt,
  });
  return normalizeAppointment({ ...appointment, _id: appointment.id });
}

async function deleteAppointment(id) {
  const res = await coll('appointments').deleteOne({ _id: id });
  return res.deletedCount > 0;
}

// ---------- customer photos (keyed by customer email) ----------

async function getCustomerPhotosMap() {
  const docs = await coll('customerphotos').find().toArray();
  const out = {};
  docs.forEach((d) => {
    out[d._id] = Array.isArray(d.photos) ? d.photos : [];
  });
  return out;
}

async function addCustomerPhoto(email, photo) {
  await coll('customerphotos').updateOne(
    { _id: email },
    { $push: { photos: photo } },
    { upsert: true },
  );
}

// Remove a photo from every customer once it is deleted from Cloudinary.
// Leaves the customer document in place only if it still has photos.
async function removeCustomerPhotoByPublicId(publicId) {
  await coll('customerphotos').updateMany(
    { 'photos.public_id': publicId },
    { $pull: { photos: { public_id: publicId } } },
  );
  await coll('customerphotos').deleteMany({ photos: { $size: 0 } });
}

// ---------- categories (kept as an ordered list) ----------

async function getCategories() {
  const doc = await coll('categories').findOne({ _id: 'main' });
  const list = doc && Array.isArray(doc.list) ? doc.list : [];
  return list.map((c) => ({ key: c.key, name: String(c.name || '') }));
}

async function addCategory(category) {
  const res = await coll('categories').updateOne(
    { _id: 'main' },
    { $push: { list: category } },
    { upsert: true },
  );
  return res.matchedCount > 0 || res.upsertedCount > 0;
}

async function renameCategory(key, name) {
  const doc = await coll('categories').findOneAndUpdate(
    { _id: 'main', 'list.key': key },
    { $set: { 'list.$.name': name } },
    { returnDocument: 'after' },
  );
  if (!doc.value) return null;
  const found = doc.value.list.find((c) => c.key === key);
  return found ? { key: found.key, name: found.name } : null;
}

async function deleteCategory(key) {
  const res = await coll('categories').updateOne(
    { _id: 'main' },
    { $pull: { list: { key } } },
  );
  return res.matchedCount > 0;
}

// ---------- site ----------

async function getSite() {
  const doc = await coll('site').findOne({ _id: 'main' });
  return doc ? doc : clone(DEFAULT_SITE);
}

async function saveSite(content) {
  await coll('site').updateOne(
    { _id: 'main' },
    { $set: content },
    { upsert: true },
  );
  return content;
}

// ---------- admin password ----------

async function getAdminHash() {
  const doc = await coll('admin').findOne({ _id: 'admin' });
  return doc && typeof doc.passwordHash === 'string' && doc.passwordHash ? doc.passwordHash : null;
}

async function setAdminHash(hash) {
  await coll('admin').updateOne(
    { _id: 'admin' },
    { $set: { passwordHash: hash } },
    { upsert: true },
  );
}

module.exports = {
  ensureDefaults,
  DEFAULT_SITE,
  DEFAULT_CATEGORIES,
  deepMerge,
  getComments,
  getCommentsWithEmail,
  addComment,
  setCommentFeatured,
  deleteComment,
  getAppointments,
  addAppointment,
  deleteAppointment,
  getCustomerPhotosMap,
  addCustomerPhoto,
  removeCustomerPhotoByPublicId,
  getCategories,
  addCategory,
  renameCategory,
  deleteCategory,
  getSite,
  saveSite,
  getAdminHash,
  setAdminHash,
  normalizeEmail,
};
const router = require('express').Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getCategories,
  addCategory,
  renameCategory,
  deleteCategory,
  DEFAULT_CATEGORIES,
} = require('../utils/store');

const MAX_NAME = 40;

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCategory(c) {
  return { key: c.key, name: String(c.name || '') };
}

// All categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await getCategories();
    const list = categories.length ? categories : DEFAULT_CATEGORIES.map(normalizeCategory);
    res.json({ categories: list });
  } catch (err) {
    console.error('Failed to load categories:', err.message);
    res.status(500).json({ message: 'Failed to load categories' });
  }
});

// Create a category (admin)
router.post('/', authenticate, async (req, res) => {
  try {
    const name = (req.body && req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    if (name.length > MAX_NAME) {
      return res.status(400).json({ message: `Category name must be ${MAX_NAME} characters or fewer` });
    }
    const key = slugify(name);
    if (!key) {
      return res.status(400).json({ message: 'Category name must contain letters or numbers' });
    }
    const categories = await getCategories();
    if (categories.some((c) => c.key === key)) {
      return res.status(400).json({ message: 'A category with that name already exists' });
    }
    const category = { key, name };
    await addCategory(category);
    res.status(201).json({ category });
  } catch (err) {
    console.error('Failed to add category:', err.message);
    res.status(500).json({ message: 'Failed to add category' });
  }
});

// Rename a category (admin) — the key (folder) stays the same so existing
// photos keep their category; only the public display name changes.
router.put('/:key', authenticate, async (req, res) => {
  try {
    const name = (req.body && req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    if (name.length > MAX_NAME) {
      return res.status(400).json({ message: `Category name must be ${MAX_NAME} characters or fewer` });
    }
    const key = String(req.params.key || '').trim();
    const categories = await getCategories();
    if (!categories.some((c) => c.key === key)) {
      return res.status(404).json({ message: 'Category not found' });
    }
    if (categories.some((c) => c.key !== key && c.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ message: 'Another category already uses that name' });
    }
    const updated = await renameCategory(key, name);
    res.json({ category: updated || { key, name } });
  } catch (err) {
    console.error('Failed to rename category:', err.message);
    res.status(500).json({ message: 'Failed to rename category' });
  }
});

// Delete a category (admin) — photos in that folder stay live and simply
// show up in the "All" gallery view until you decide what to do with them.
router.delete('/:key', authenticate, async (req, res) => {
  try {
    const key = String(req.params.key || '').trim();
    const removed = await deleteCategory(key);
    if (!removed) {
      const categories = await getCategories();
      if (!categories.some((c) => c.key === key)) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }
    res.json({ message: 'Category deleted', key });
  } catch (err) {
    console.error('Failed to delete category:', err.message);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

module.exports = router;
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authMiddleware');
const { getAdminHash, setAdminHash } = require('../utils/store');

const ENV_PASSWORD_HASH = process.env.ADMIN_PASSWORD
  ? bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10)
  : null;

async function resolveAdminHash() {
  // Prefer the hash stored on disk (set via the admin "change password" panel)
  // so it survives restarts; fall back to the ADMIN_PASSWORD env var.
  const stored = await getAdminHash();
  return stored || ENV_PASSWORD_HASH;
}

router.post('/login', async (req, res) => {
  try {
    const password = req.body && req.body.password;
    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ message: 'Password required' });
    }
    const hash = await resolveAdminHash();
    if (!hash) {
      return res.status(401).json({ message: 'Admin password not configured on the server' });
    }
    const valid = bcrypt.compareSync(password, hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET not configured on the server' });
    }
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ token });
  } catch (err) {
    console.error('Login failed:', err.message);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Change the admin password (admin only). The new hash is stored on disk
// so it survives restarts and takes priority over ADMIN_PASSWORD.
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const current = req.body && req.body.currentPassword;
    const next = req.body && req.body.newPassword;
    if (typeof current !== 'string' || current.length === 0) {
      return res.status(400).json({ message: 'Current password required' });
    }
    if (typeof next !== 'string' || next.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const hash = await resolveAdminHash();
    if (!hash) {
      return res.status(500).json({ message: 'Admin password not configured on the server' });
    }
    if (!bcrypt.compareSync(current, hash)) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    await setAdminHash(bcrypt.hashSync(next, 10));
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Password change failed:', err.message);
    res.status(500).json({ message: 'Password change failed' });
  }
});

module.exports = router;
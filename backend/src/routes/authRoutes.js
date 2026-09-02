const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD
  ? bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10)
  : null;

router.post('/login', (req, res) => {
  const password = req.body && req.body.password;
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ message: 'Password required' });
  }
  if (!ADMIN_PASSWORD_HASH) {
    return res.status(401).json({ message: 'Admin password not configured on the server' });
  }
  const valid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT_SECRET not configured on the server' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

module.exports = router;
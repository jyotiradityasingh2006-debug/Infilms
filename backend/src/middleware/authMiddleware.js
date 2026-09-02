const jwt = require('jsonwebtoken');

module.exports = function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }
  const token = header.slice(7).trim();
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ message });
  }
};
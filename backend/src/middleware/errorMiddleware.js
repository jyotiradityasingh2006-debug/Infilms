function notFound(req, res) {
  res.status(404).json({ message: 'Not found' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  if (err && err.code && err.code.startsWith('LIMIT_')) {
    return res.status(400).json({ message: 'File too large (max 10MB)' });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ message: err.message || 'Server error' });
}

module.exports = { notFound, errorHandler };
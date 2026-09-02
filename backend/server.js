const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./src/routes/authRoutes');
const photoRoutes = require('./src/routes/photoRoutes');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
  }),
);

const REQUIRED_ENV = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'ADMIN_PASSWORD',
  'JWT_SECRET',
];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.warn(`[warn] Missing env values (will be limited until filled in backend/.env): ${missing.join(', ')}`);
}

app.use(express.json({ limit: '1mb' }));

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend working', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'Index.html'));
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
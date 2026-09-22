const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const { connect, close } = require('./src/db');
const { migrateFilestore } = require('./src/migrate');
const { ensureDefaults } = require('./src/utils/store');

dotenv.config();

const authRoutes = require('./src/routes/authRoutes');
const photoRoutes = require('./src/routes/photoRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const siteRoutes = require('./src/routes/siteRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
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
      if (!origin || ALLOWED_ORIGINS.length === 0) return cb(null, true);
      let allowed = ALLOWED_ORIGINS.includes(origin);
      if (!allowed) {
        try {
          const u = new URL(origin);
          allowed = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
        } catch (e) {
          allowed = false;
        }
      }
      return cb(null, allowed);
    },
  }),
);

const REQUIRED_ENV = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
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
app.use('/api/comments', commentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/categories', categoryRoutes);

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'Index.html'));
});

app.use(notFound);
app.use(errorHandler);

async function bootstrap() {
  try {
    await connect();
    const migration = await migrateFilestore();
    const migrated = migration.migrated || [];
    if (migrated.length) {
      console.log(`[migrate] Imported ${migrated.length} collection(s) from the old JSON store: ${migrated.map((m) => `${m.collection} (${m.docs})`).join(', ')}`);
    }
    await ensureDefaults();
    console.log('Data store: MongoDB');
  } catch (err) {
    console.error('Startup failed:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap();

process.on('SIGINT', async () => {
  await close();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await close();
  process.exit(0);
});
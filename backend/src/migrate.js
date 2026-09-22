// One-time migration: imports any existing data from the old JSON file store
// (backend/data/db.filestore.json) into MongoDB. Each collection is only
// imported if the equivalent MongoDB collection is still empty, so re-runs are
// safe and never overwrite newer data.
const fs = require('fs');
const path = require('path');
const { coll } = require('./db');

const FILESTORE = path.join(__dirname, '..', 'data', 'db.filestore.json');
const COLLECTIONS = ['site', 'categories', 'comments', 'appointments', 'customerphotos', 'admin'];

function readFilestore() {
  try {
    if (!fs.existsSync(FILESTORE)) return null;
    const raw = JSON.parse(fs.readFileSync(FILESTORE, 'utf8'));
    const out = {};
    COLLECTIONS.forEach((name) => {
      if (Array.isArray(raw[name])) out[name] = raw[name];
    });
    return out;
  } catch (err) {
    return null;
  }
}

async function migrateFilestore() {
  const data = readFilestore();
  if (!data) {
    return { migrated: [], source: null };
  }

  const migrated = [];
  for (const name of COLLECTIONS) {
    const docs = data[name] || [];
    if (docs.length === 0) continue;

    const existing = await coll(name).countDocuments({});
    if (existing > 0) continue;

    const clean = docs.map((d) => JSON.parse(JSON.stringify(d)));
    if (clean.length) {
      await coll(name).insertMany(clean);
      migrated.push({ collection: name, docs: clean.length });
    }
  }

  return { migrated, source: FILESTORE };
}

module.exports = { migrateFilestore, FILESTORE };
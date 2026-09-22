// MongoDB data layer.
//
// Uses `MONGODB_URI` from backend/.env when set (e.g. a MongoDB Atlas cluster).
// When it is not set, a throw-away in-memory MongoDB is started automatically so
// the app runs out of the box in development. Any data still sitting in the old
// JSON file store (backend/data/db.filestore.json) is migrated in on startup
// (see src/migrate.js).
const { MongoClient } = require('mongodb');

let client = null;
let db = null;
let memoryServer = null;

const DB_NAME = process.env.MONGODB_DB || 'infilms';

async function startMemoryServer() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  return memoryServer.getUri();
}

async function connect() {
  const configured = (process.env.MONGODB_URI || '').trim();

  if (configured) {
    client = new MongoClient(configured, { serverSelectionTimeoutMS: 20000 });
  } else {
    console.log('[db] No MONGODB_URI set — starting an in-memory MongoDB (dev only). Set MONGODB_URI in backend/.env to use a persistent database.');
    try {
      const uri = await startMemoryServer();
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
    } catch (err) {
      throw new Error('MONGODB_URI is not set and no in-memory MongoDB could be started. Add a MongoDB connection string to backend/.env (e.g. MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net).');
    }
  }

  try {
    await client.connect();
    db = client.db(DB_NAME);
  } catch (err) {
    throw new Error(`Could not connect to MongoDB${configured ? ' at the configured MONGODB_URI' : ''}. Check backend/.env and that the database is reachable.`);
  }
  return db;
}

async function close() {
  if (client) {
    try {
      await client.close();
    } catch (err) {
      // Ignore — best effort shutdown.
    }
  }
  if (memoryServer) {
    try {
      await memoryServer.stop();
    } catch (err) {
      // Ignore.
    }
  }
}

function currentMode() {
  return 'mongo';
}

function getDb() {
  if (!db) throw new Error('Data store not initialised');
  return db;
}

// Returns a MongoDB collection that also matches the small subset of the API
// the app used on the old file store (notably findOneAndUpdate returning a
// `{ value }` wrapper, exactly like the previous data layer).
function coll(name) {
  const collection = getDb().collection(name);

  return {
    find(filter) {
      return collection.find(filter);
    },
    findOne(filter) {
      return collection.findOne(filter);
    },
    countDocuments(filter) {
      return collection.countDocuments(filter);
    },
    insertOne(doc) {
      return collection.insertOne(doc);
    },
    insertMany(docs) {
      return collection.insertMany(docs);
    },
    updateOne(filter, update, opts) {
      return collection.updateOne(filter, update, opts);
    },
    updateMany(filter, update) {
      return collection.updateMany(filter, update);
    },
    async findOneAndUpdate(filter, update, opts) {
      const res = await collection.findOneAndUpdate(
        filter,
        update,
        {
          upsert: !!(opts && opts.upsert),
          returnDocument: 'after',
          includeResultMetadata: true,
        },
      );
      return { value: res && res.value ? res.value : null };
    },
    deleteOne(filter) {
      return collection.deleteOne(filter);
    },
    deleteMany(filter) {
      return collection.deleteMany(filter);
    },
  };
}

module.exports = { connect, close, getDb, coll, currentMode };
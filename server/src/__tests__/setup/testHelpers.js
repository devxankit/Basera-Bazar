'use strict';
const mongoose = require('mongoose');

/**
 * Connect to the in-memory MongoDB set up by globalSetup.
 * Call this in beforeAll for integration tests.
 */
async function connectTestDB() {
  if (mongoose.connection.readyState !== 0) return;
  await mongoose.connect(process.env.MONGO_URI);
}

/**
 * Drop all collections between tests to keep them isolated.
 */
async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

/**
 * Disconnect from MongoDB. Call in afterAll.
 */
async function disconnectTestDB() {
  await mongoose.disconnect();
}

module.exports = { connectTestDB, clearCollections, disconnectTestDB };

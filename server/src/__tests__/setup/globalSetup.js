'use strict';
const { MongoMemoryReplSet } = require('mongodb-memory-server');

module.exports = async () => {
  // Replica set required for multi-document transactions
  const mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';
  process.env.NODE_ENV = 'test';
  global.__MONGOD__ = mongod;
};

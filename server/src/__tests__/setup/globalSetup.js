'use strict';
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
  process.env.NODE_ENV = 'test';
  // Store instance reference for teardown
  global.__MONGOD__ = mongod;
};

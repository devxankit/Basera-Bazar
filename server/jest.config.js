'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*.test.js'],
  globalSetup: './src/__tests__/setup/globalSetup.js',
  globalTeardown: './src/__tests__/setup/globalTeardown.js',
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  // Run test files sequentially — all tests share one in-memory MongoDB instance
  // and parallel workers would race on clearCollections().
  maxWorkers: 1
};

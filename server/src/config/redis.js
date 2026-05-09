// NOTE: This file is designed to fall back gracefully to the in-memory cache
// if the ioredis package is not installed or the Redis server is unreachable.
let Redis;
try {
  Redis = require('ioredis');
} catch (error) {
  console.warn('[Redis Setup] ioredis package not found. Redis caching will be disabled.');
}

// Ensure there is a REDIS_URL in production, otherwise default to local
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient = null;

if (Redis) {
  try {
    redisClient = new Redis(REDIS_URL, {
      family: 4, // Force IPv4 to prevent ENOTFOUND / empty errors with Upstash on Node 18+
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[Redis] Connection failed after 3 retries. Falling back to in-memory cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000); // Reconnect after a delay
      }
    });

    redisClient.on('connect', () => {
      console.log('🚀 Redis Connected Successfully');
    });

    redisClient.on('error', (err) => {
      console.warn(`[Redis] Connection Error: ${err.message}. (Using fallback)`);
    });
  } catch (err) {
    console.warn(`[Redis] Initialization Error: ${err.message}. (Using fallback)`);
  }
}

module.exports = redisClient;

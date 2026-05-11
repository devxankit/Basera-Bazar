const redisClient = require('../config/redis');

const memoryCache = new Map();

// All app keys are namespaced under this prefix so clear() never touches
// keys belonging to other services sharing the same Redis instance.
const APP_PREFIX = '__express__';

/**
 * Scan Redis for all keys matching a glob pattern using non-blocking SCAN.
 * Safe in production — will not block the Redis event loop.
 */
async function scanKeys(pattern) {
  const matched = [];
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    matched.push(...keys);
  } while (cursor !== '0');
  return matched;
}

const CacheManager = {
  set: async (key, value, ttlMinutes = 5) => {
    try {
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.setex(key, ttlMinutes * 60, JSON.stringify(value));
        return;
      }
    } catch (e) { /* fall through to in-memory */ }

    const expires = Date.now() + ttlMinutes * 60 * 1000;
    memoryCache.set(key, { value, expires });
  },

  get: async (key) => {
    try {
      if (redisClient && redisClient.status === 'ready') {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (e) { /* fall through */ }

    const data = memoryCache.get(key);
    if (!data) return null;
    if (Date.now() > data.expires) {
      memoryCache.delete(key);
      return null;
    }
    return data.value;
  },

  delete: async (key) => {
    try {
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.del(key);
        return;
      }
    } catch (e) { /* fall through */ }
    memoryCache.delete(key);
  },

  /**
   * Delete all keys starting with prefix using non-blocking SCAN (safe in production).
   */
  clearByPrefix: async (prefix) => {
    try {
      if (redisClient && redisClient.status === 'ready') {
        const keys = await scanKeys(`${prefix}*`);
        if (keys.length > 0) {
          // DEL accepts multiple keys; chunk to avoid oversized commands
          const CHUNK = 100;
          for (let i = 0; i < keys.length; i += CHUNK) {
            await redisClient.del(...keys.slice(i, i + CHUNK));
          }
        }
        return;
      }
    } catch (e) { /* fall through */ }

    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
  },

  /**
   * Clear only app-owned cache keys (never flushes the entire Redis instance).
   */
  clear: async () => {
    await CacheManager.clearByPrefix(APP_PREFIX);
    memoryCache.clear();
  }
};

/** Returns true if Redis is reachable, false if using in-memory fallback. */
async function ping() {
  try {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.ping();
      return true;
    }
  } catch (_) {}
  return false;
}

module.exports = CacheManager;
module.exports.ping = ping;

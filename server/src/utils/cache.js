const redisClient = require('../config/redis');

// Fallback in-memory cache (original implementation)
const memoryCache = new Map();

/**
 * Universal Cache Manager
 * Uses Redis if available, falls back to in-memory Map if not.
 */
const CacheManager = {
  /**
   * Set a value in cache
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlMinutes Default 5 minutes
   */
  set: async (key, value, ttlMinutes = 5) => {
    try {
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.setex(key, ttlMinutes * 60, JSON.stringify(value));
        return;
      }
    } catch (e) {
      // Ignore redis error and fallback
    }

    // Fallback
    const expires = Date.now() + ttlMinutes * 60 * 1000;
    memoryCache.set(key, { value, expires });
  },

  /**
   * Get a value from cache
   * @param {string} key 
   * @returns {any|null}
   */
  get: async (key) => {
    try {
      if (redisClient && redisClient.status === 'ready') {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (e) {
      // Ignore redis error and fallback
    }

    // Fallback
    const data = memoryCache.get(key);
    if (!data) return null;

    if (Date.now() > data.expires) {
      memoryCache.delete(key);
      return null;
    }

    return data.value;
  },

  /**
   * Delete a specific key
   * @param {string} key 
   */
  delete: async (key) => {
    try {
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.del(key);
        return;
      }
    } catch (e) {}
    
    // Fallback
    memoryCache.delete(key);
  },

  /**
   * Clear all keys starting with a prefix
   * @param {string} prefix 
   */
  clearByPrefix: async (prefix) => {
    try {
      if (redisClient && redisClient.status === 'ready') {
        const keys = await redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
        return;
      }
    } catch (e) {}

    // Fallback
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
  },

  /**
   * Clear all cache
   */
  clear: async () => {
    try {
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.flushall();
        return;
      }
    } catch (e) {}

    // Fallback
    memoryCache.clear();
  }
};

module.exports = CacheManager;

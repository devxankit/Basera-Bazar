const cache = new Map();

/**
 * Simple in-memory cache with TTL (Time To Live) support.
 */
const CacheManager = {
  /**
   * Set a value in cache
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlMinutes Default 5 minutes
   */
  set: (key, value, ttlMinutes = 5) => {
    const expires = Date.now() + ttlMinutes * 60 * 1000;
    cache.set(key, { value, expires });
  },

  /**
   * Get a value from cache
   * @param {string} key 
   * @returns {any|null}
   */
  get: (key) => {
    const data = cache.get(key);
    if (!data) return null;

    if (Date.now() > data.expires) {
      cache.delete(key);
      return null;
    }

    return data.value;
  },

  /**
   * Delete a specific key
   * @param {string} key 
   */
  delete: (key) => {
    cache.delete(key);
  },

  /**
   * Clear all cache
   */
  clear: () => {
    cache.clear();
  }
};

module.exports = CacheManager;

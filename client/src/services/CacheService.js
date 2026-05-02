/**
 * A simple TTL-based in-memory cache service.
 */
class CacheService {
  constructor() {
    this._cache = new Map();
  }

  /**
   * Get data from cache or fetch it if missing/expired.
   * @param {string} key Unique key for the cache.
   * @param {Function} fetcher Async function to fetch data.
   * @param {number} ttl Time to live in milliseconds.
   * @returns {Promise<any>}
   */
  async get(key, fetcher, ttl = 3 * 60 * 1000) {
    const now = Date.now();
    const cached = this._cache.get(key);

    if (cached && now < cached.expiresAt) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      // If fetch fails but we have stale data, return it
      if (cached) {
        console.warn(`Fetch failed for key ${key}, returning stale data.`, error);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Manually set cache data.
   */
  set(key, data, ttl = 3 * 60 * 1000) {
    this._cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    });
  }

  /**
   * Invalidate a specific key or all keys starting with a prefix.
   * @param {string} keyOrPrefix 
   */
  invalidate(keyOrPrefix) {
    if (this._cache.has(keyOrPrefix)) {
      this._cache.delete(keyOrPrefix);
    } else {
      for (const key of this._cache.keys()) {
        if (key.startsWith(keyOrPrefix)) {
          this._cache.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cache.
   */
  clear() {
    this._cache.clear();
  }
}

export const cacheService = new CacheService();

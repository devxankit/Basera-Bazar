const CacheManager = require('../utils/cache');

/**
 * Middleware to cache API responses
 * @param {number} ttlMinutes Time to live in minutes
 */
const cacheMiddleware = (ttlMinutes = 5) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate a unique key based on URL and query params
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedResponse = CacheManager.get(key);

    if (cachedResponse) {
      console.log(`[Cache] Serving from cache: ${req.url}`);
      return res.json(cachedResponse);
    } else {
      // Monkey-patch res.json to capture and cache the response
      const originalJson = res.json;
      res.json = (body) => {
        CacheManager.set(key, body, ttlMinutes);
        return originalJson.call(res, body);
      };
      next();
    }
  };
};

module.exports = cacheMiddleware;

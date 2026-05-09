const CacheManager = require('../utils/cache');

/**
 * Middleware to cache API responses
 * @param {number} ttlMinutes Time to live in minutes
 * @param {boolean} userScoped If true, the cache key will include the user ID
 */
const cacheMiddleware = (ttlMinutes = 5, userScoped = false) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate a unique key based on URL and query params
    // If userScoped is true, append the user ID to the key
    const prefix = userScoped && req.user ? `user:${req.user.id}:` : 'public:';
    const key = `__express__${prefix}${req.originalUrl || req.url}`;
    
    try {
      const cachedResponse = await CacheManager.get(key);

      if (cachedResponse) {
        console.log(`[Cache] Serving from cache: ${key}`);
        return res.json(cachedResponse);
      } else {
        // Monkey-patch res.json to capture and cache the response
        const originalJson = res.json;
        res.json = (body) => {
          // Fire and forget caching
          CacheManager.set(key, body, ttlMinutes).catch(err => console.error('[Cache Set Error]', err));
          // Restore original function to avoid infinite loop
          res.json = originalJson;
          return originalJson.call(res, body);
        };
        next();
      }
    } catch (error) {
      console.error('[Cache Middleware Error]', error);
      next(); // Proceed without cache if there's an error
    }
  };
};

module.exports = cacheMiddleware;

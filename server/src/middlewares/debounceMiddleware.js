const pendingRequests = new Map();

/**
 * Middleware to debounce / collapse identical rapid requests.
 * Useful for heavy read operations.
 */
const debounceMiddleware = (req, res, next) => {
  if (req.method !== 'GET') return next();

  const key = `${req.method}:${req.originalUrl || req.url}`;

  if (pendingRequests.has(key)) {
    console.log(`[Debounce] Collapsing request: ${key}`);
    return pendingRequests.get(key).then(data => res.json(data));
  }

  // Create a promise for the current request
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  pendingRequests.set(key, promise);

  const originalJson = res.json;
  res.json = (body) => {
    resolvePromise(body);
    pendingRequests.delete(key);
    return originalJson.call(res, body);
  };

  next();
};

module.exports = debounceMiddleware;

const logger = require('../utils/logger');

const pendingRequests = new Map();
const DEDUP_TIMEOUT_MS = 10_000;

/**
 * Collapses identical in-flight GET requests from the SAME authenticated user.
 * Key includes the Authorization header so user data is never shared across users.
 */
const debounceMiddleware = (req, res, next) => {
  if (req.method !== 'GET') return next();

  // Per-user key — prevents cross-user data leaks
  const authToken = req.headers.authorization || 'anonymous';
  const key = `${req.method}:${req.originalUrl || req.url}:${authToken}`;

  if (pendingRequests.has(key)) {
    logger.info(`[Debounce] Collapsing: ${req.method} ${req.originalUrl || req.url}`);
    return pendingRequests.get(key).then(
      (data) => res.json(data),
      () => next() // original request failed — let this one proceed independently
    );
  }

  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  // Safety net: prevents Map leak if handler never calls res.json
  const timer = setTimeout(() => {
    if (pendingRequests.has(key)) {
      pendingRequests.delete(key);
      rejectPromise(new Error('Dedup timeout'));
    }
  }, DEDUP_TIMEOUT_MS);

  pendingRequests.set(key, promise);

  const cleanup = (resolved, data) => {
    clearTimeout(timer);
    pendingRequests.delete(key);
    if (resolved) resolvePromise(data);
    else rejectPromise(new Error('Connection closed before response'));
  };

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    cleanup(true, body);
    return originalJson(body);
  };

  // Clean up if client disconnects before the handler responds
  res.on('close', () => {
    if (pendingRequests.has(key)) cleanup(false);
  });

  next();
};

module.exports = debounceMiddleware;

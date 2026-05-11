const CacheManager = require('../utils/cache');
const logger = require('../utils/logger');

const TTL_MINUTES = 24 * 60; // 24 hours

/**
 * Idempotency middleware for mutation endpoints (POST withdrawals, payments, etc.).
 *
 * Clients send an `Idempotency-Key` header (UUID). On the first request with that
 * key the response is stored; subsequent requests with the same key return the
 * stored response without re-executing the handler. Keys expire after 24 hours.
 *
 * If the key is absent the request proceeds normally — no enforcement.
 * If the key is present and the first request is still in flight, the server
 * returns 409 Conflict to signal the client to retry later.
 */
const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) return next();

  if (idempotencyKey.length > 128) {
    return res.status(400).json({ success: false, message: 'Idempotency-Key must be 128 characters or fewer.' });
  }

  const cacheKey = `idempotency:${req.user?.id || 'anon'}:${idempotencyKey}`;

  try {
    const cached = await CacheManager.get(cacheKey);

    if (cached === 'IN_FLIGHT') {
      return res.status(409).json({
        success: false,
        code: 'REQUEST_IN_FLIGHT',
        message: 'A request with this Idempotency-Key is currently being processed. Please retry shortly.'
      });
    }

    if (cached) {
      res.set('Idempotency-Replayed', 'true');
      return res.status(cached.status).json(cached.body);
    }

    // Mark as in-flight before processing
    await CacheManager.set(cacheKey, 'IN_FLIGHT', 1);

    // Intercept res.json to capture and store the response
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      try {
        await CacheManager.set(cacheKey, { status: res.statusCode, body }, TTL_MINUTES);
      } catch (err) {
        logger.warn({ err, cacheKey }, 'Failed to persist idempotency response');
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    logger.error({ err }, 'Idempotency middleware error — proceeding without idempotency guard');
    next();
  }
};

module.exports = idempotencyMiddleware;

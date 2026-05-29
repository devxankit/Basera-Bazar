const logger = require('./logger');

/**
 * Maps common error shapes to a sensible HTTP response so controllers never
 * leak a generic 500 for what is really a client/input problem.
 *
 *   - Mongoose ValidationError  → 400 with the first field message
 *   - Mongoose CastError        → 400 (malformed id / wrong type)
 *   - Duplicate key (11000)     → 409 with the offending field
 *   - anything else             → 500 with a safe fallback message
 *
 * Usage:  } catch (error) { return respondError(res, error, 'Create category', 'Could not create category.'); }
 */
function respondError(res, error, context = 'Request', fallback = 'An unexpected error occurred. Please try again.') {
  logger.error({ err: error }, `${context} error`);

  if (error?.name === 'ValidationError') {
    const first = Object.values(error.errors || {})[0];
    return res.status(400).json({
      success: false,
      message: first?.message || 'Some required fields are missing or invalid. Please check your input.',
    });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value provided for "${error.path}".`,
    });
  }

  if (error?.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  return res.status(500).json({ success: false, message: fallback });
}

module.exports = respondError;

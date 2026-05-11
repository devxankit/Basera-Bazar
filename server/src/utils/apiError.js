/**
 * Structured API error with a machine-readable code.
 * Throw this inside any controller; the global error handler catches it.
 *
 * Usage:
 *   throw new ApiError(400, 'INSUFFICIENT_BALANCE', 'Not enough balance to withdraw.');
 */
class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isApiError = true;
  }
}

module.exports = ApiError;

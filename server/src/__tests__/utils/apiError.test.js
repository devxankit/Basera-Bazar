'use strict';
const ApiError = require('../../utils/apiError');

describe('ApiError', () => {
  test('is an instance of Error', () => {
    const err = new ApiError(400, 'BAD_REQUEST', 'Invalid input');
    expect(err).toBeInstanceOf(Error);
  });

  test('sets statusCode, code, and message', () => {
    const err = new ApiError(404, 'NOT_FOUND', 'Resource not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
  });

  test('sets isApiError flag to true', () => {
    const err = new ApiError(500, 'SERVER_ERROR', 'Oops');
    expect(err.isApiError).toBe(true);
  });

  test('can be caught as a regular error', () => {
    const throwIt = () => { throw new ApiError(403, 'FORBIDDEN', 'No access'); };
    expect(throwIt).toThrow('No access');
  });

  test('stack trace is populated', () => {
    const err = new ApiError(422, 'VALIDATION', 'Invalid');
    expect(err.stack).toBeDefined();
  });

  test('works with different status codes', () => {
    expect(new ApiError(200, 'OK', 'ok').statusCode).toBe(200);
    expect(new ApiError(401, 'UNAUTHORIZED', 'auth').statusCode).toBe(401);
  });
});

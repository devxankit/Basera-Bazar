'use strict';
const { checkLockout, recordFailedAttempt, resetFailedAttempts } = require('../../utils/loginLockout');

const makeMockModel = (overrides = {}) => ({
  findByIdAndUpdate: jest.fn().mockResolvedValue({ failed_login_attempts: 1, ...overrides }),
});

describe('checkLockout', () => {
  test('returns locked:false when account has no lockout_until', () => {
    expect(checkLockout({})).toEqual({ locked: false });
  });

  test('returns locked:false when lockout_until is in the past', () => {
    const past = new Date(Date.now() - 1000);
    expect(checkLockout({ lockout_until: past })).toEqual({ locked: false });
  });

  test('returns locked:true with retryAfter when lockout is active', () => {
    const future = new Date(Date.now() + 60_000);
    const result = checkLockout({ lockout_until: future });
    expect(result.locked).toBe(true);
    expect(result.retryAfter).toBe(future);
  });
});

describe('recordFailedAttempt', () => {
  test('increments failed_login_attempts', async () => {
    const Model = makeMockModel({ failed_login_attempts: 1 });
    await recordFailedAttempt(Model, 'user123');
    expect(Model.findByIdAndUpdate).toHaveBeenCalledWith(
      'user123',
      { $inc: { failed_login_attempts: 1 } },
      { new: true, select: 'failed_login_attempts' }
    );
  });

  test('sets lockout_until when attempts reach MAX (5)', async () => {
    // Return count=5 from the increment call, triggering lockout
    const Model = {
      findByIdAndUpdate: jest.fn()
        .mockResolvedValueOnce({ failed_login_attempts: 5 })
        .mockResolvedValueOnce({}),
    };
    await recordFailedAttempt(Model, 'user123');
    expect(Model.findByIdAndUpdate).toHaveBeenCalledTimes(2);
    const lockoutCall = Model.findByIdAndUpdate.mock.calls[1];
    expect(lockoutCall[1]).toHaveProperty('lockout_until');
    expect(lockoutCall[1].lockout_until).toBeInstanceOf(Date);
  });

  test('does not set lockout when attempts below 5', async () => {
    const Model = {
      findByIdAndUpdate: jest.fn().mockResolvedValue({ failed_login_attempts: 3 }),
    };
    await recordFailedAttempt(Model, 'user123');
    expect(Model.findByIdAndUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('resetFailedAttempts', () => {
  test('resets counter and clears lockout', async () => {
    const Model = { findByIdAndUpdate: jest.fn().mockResolvedValue({}) };
    await resetFailedAttempts(Model, 'user123');
    expect(Model.findByIdAndUpdate).toHaveBeenCalledWith('user123', {
      failed_login_attempts: 0,
      lockout_until: null,
    });
  });
});

/**
 * Shared per-account login lockout helpers.
 *
 * Policy: 5 failed attempts within any window locks the account for 15 minutes.
 * Lockout is stored on the account document — survives server restarts and
 * works correctly in multi-process / clustered deployments without Redis.
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if the account is currently locked.
 * Returns { locked: true, retryAfter: Date } or { locked: false }.
 */
function checkLockout(account) {
  if (account.lockout_until && account.lockout_until > new Date()) {
    return { locked: true, retryAfter: account.lockout_until };
  }
  return { locked: false };
}

/**
 * Call this after a FAILED password/OTP attempt.
 * Increments the counter and sets lockout_until once MAX_ATTEMPTS is reached.
 */
async function recordFailedAttempt(Model, accountId) {
  const newCount = await Model.findByIdAndUpdate(
    accountId,
    { $inc: { failed_login_attempts: 1 } },
    { new: true, select: 'failed_login_attempts' }
  ).then(doc => doc?.failed_login_attempts ?? 1);

  if (newCount >= MAX_ATTEMPTS) {
    const lockoutUntil = new Date(Date.now() + LOCKOUT_MS);
    await Model.findByIdAndUpdate(accountId, { lockout_until: lockoutUntil });
  }
}

/**
 * Call this after a SUCCESSFUL login.
 * Resets the counter and clears any lockout.
 */
async function resetFailedAttempts(Model, accountId) {
  await Model.findByIdAndUpdate(accountId, {
    failed_login_attempts: 0,
    lockout_until: null
  });
}

module.exports = { checkLockout, recordFailedAttempt, resetFailedAttempts };

const express = require('express');
const router = express.Router();

const {
  checkExists, requestOtp, verifyOtp, getMe, updateProfile,
  changePassword, resetPassword, loginWithPassword, checkSignupConflicts, testNotification,
  refreshToken, logoutUser, registerPartner,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { loginSchema, otpVerifySchema } = require('../utils/validators');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// -----------------------------------------------------
// Rate limiters — moved from global index.js to here
// -----------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true' || process.env.JEST_WORKER_ID !== undefined,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 5 minutes.' }
});

// 10 OTP sends per 5 min per IP per module — keyed by IP + role so user/partner counters are independent
const sendOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}-${req.body?.role || 'user'}`,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true' || process.env.JEST_WORKER_ID !== undefined || process.env.TESTING_MODE === 'true',
  message: { success: false, message: 'Too many OTP requests. Please wait 5 minutes before trying again.' }
});

// 10 verify attempts per 5 min per IP per module
const verifyOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}-${req.body?.role || 'user'}`,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true' || process.env.JEST_WORKER_ID !== undefined || process.env.TESTING_MODE === 'true',
  message: { success: false, message: 'Too many OTP verification attempts. Please wait 5 minutes.' }
});

// 15 reset-password attempts per 5 min per IP — independent of OTP send counter
const resetPasswordLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true' || process.env.JEST_WORKER_ID !== undefined,
  message: { success: false, message: 'Too many password reset attempts. Please wait 5 minutes before trying again.' }
});

// POST /api/auth/check-exists — Check if email/phone already registered (Signup)
router.post('/check-exists', authLimiter, checkExists);

// POST /api/auth/check-conflicts
router.post('/check-conflicts', authLimiter, checkSignupConflicts);

// POST /api/auth/send-otp
router.post('/send-otp', sendOtpLimiter, requestOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtpLimiter, validate(otpVerifySchema), verifyOtp);

// POST /api/auth/login (Password login)
router.post('/login', authLimiter, validate(loginSchema), loginWithPassword);

// GET /api/auth/me (Get current user profile)
router.get('/me', protect, getMe);

// PUT /api/auth/profile (Update name, email, phone)
router.put('/profile', protect, updateProfile);

// PUT /api/auth/change-password (Change password with verification)
router.put('/change-password', protect, changePassword);

// POST /api/auth/reset-password (Forgot password — OTP verified, no auth required)
router.post('/reset-password', resetPasswordLimiter, resetPassword);

// POST /api/auth/test-notification (Send test push notification)
router.post('/test-notification', protect, testNotification);

// POST /api/auth/refresh — issue new access token from refresh cookie (no auth required)
router.post('/refresh', refreshToken);

// POST /api/auth/partner/register — create partner account at final registration step
router.post('/partner/register', authLimiter, registerPartner);

// POST /api/auth/logout — clear cookies + invalidate token version
router.post('/logout', protect, logoutUser);

module.exports = router;

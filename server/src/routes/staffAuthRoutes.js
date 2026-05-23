const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  staffLoginSchema,
  staffPasswordResetSchema,
} = require('../utils/validators');
const {
  staffLogin,
  staffLogout,
  getStaffMe,
  changeStaffPassword,
  staffForgotPassword,
  staffResetPassword,
} = require('../controllers/staff/staffAuthController');

const staffLoginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true' || process.env.JEST_WORKER_ID !== undefined,
  message: { success: false, message: 'Too many login attempts. Please try again in 5 minutes.' }
});

const staffPasswordLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || process.env.DISABLE_RATE_LIMIT === 'true' || process.env.JEST_WORKER_ID !== undefined,
  message: { success: false, message: 'Too many password reset attempts. Please try again in 5 minutes.' }
});

// Public
router.post('/login', staffLoginLimiter, validate(staffLoginSchema), staffLogin);
router.post('/forgot-password', staffPasswordLimiter, staffForgotPassword);
router.post('/reset-password', staffPasswordLimiter, staffResetPassword);

// Protected (any staff role)
router.use(protect);
router.get('/me', getStaffMe);
router.post('/logout', staffLogout);
router.put('/change-password', validate(staffPasswordResetSchema), changeStaffPassword);

module.exports = router;

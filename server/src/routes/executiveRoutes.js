const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const idempotency = require('../middlewares/idempotencyMiddleware');
const {
  registerStep1,
  verifyRegistrationOtp,
  updateStep2,
  updateStep3,
  login,
  getDashboard,
  getMyPartners,
  getMyTransactions,
  requestWithdrawal,
  updateProfile,
  updateBankDetails,
  getMyTaskHistory,
  getMySalary
} = require('../controllers/executiveController');
const { protect } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { executiveBankDetailsSchema, executiveProfileUpdateSchema, withdrawalRequestSchema } = require('../utils/validators');

// OTP limiter scoped only to registration/OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes before trying again.' }
});

router.post('/register/step1', otpLimiter, registerStep1);
router.post('/register/verify', otpLimiter, verifyRegistrationOtp);
router.post('/login', login);

// Protected routes — no OTP limiter here
router.use(protect);

router.put('/register/step2', validate(executiveBankDetailsSchema), updateStep2);
router.put('/register/step3', updateStep3);
router.get('/dashboard', cacheMiddleware(5, true), getDashboard);
router.get('/my-partners', cacheMiddleware(3, true), getMyPartners);
router.get('/transactions', cacheMiddleware(5, true), getMyTransactions);
router.post('/withdraw', validate(withdrawalRequestSchema), idempotency, requestWithdrawal);
router.put('/profile', validate(executiveProfileUpdateSchema), updateProfile);
router.put('/bank-details', validate(executiveBankDetailsSchema), updateBankDetails);
router.get('/task-history', cacheMiddleware(1, true), getMyTaskHistory);
router.get('/salary', cacheMiddleware(5, true), getMySalary);

module.exports = router;

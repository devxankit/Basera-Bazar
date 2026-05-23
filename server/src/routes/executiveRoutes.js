const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const idempotency = require('../middlewares/idempotencyMiddleware');
const {
  registerStep1,
  verifyRegistrationOtp,
  createExecutive,
  updateStep2,
  updateStep3,
  login,
  getDashboard,
  getMyPartners,
  getMyPartnerDetail,
  getMyTransactions,
  requestWithdrawal,
  updateProfile,
  updateBankDetails,
  getMyTaskHistory,
  getMySalary
} = require('../controllers/executiveController');
const { protect, verifyApproved } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { executiveBankDetailsSchema, executiveRegisterStep2Schema, executiveProfileUpdateSchema, withdrawalRequestSchema, gpsCheckinSchema, leaveRequestSchema, dailyReportSchema } = require('../utils/validators');
const {
  fieldExecutiveCheckIn,
  fieldExecutiveCheckOut,
  getExecutiveAttendance,
  getExecutiveTodayAttendance,
  submitLeaveRequest,
  getMyLeaves,
} = require('../controllers/staff/attendanceController');
const {
  submitExecutiveDailyReport,
  getExecutiveDailyReports,
  getExecutiveTargets,
} = require('../controllers/staff/executiveStaffController');

// OTP limiter scoped only to registration/OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined,
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes before trying again.' }
});

router.post('/register/step1', otpLimiter, registerStep1);
router.post('/register/verify', otpLimiter, verifyRegistrationOtp);
router.post('/register/create', createExecutive);
router.post('/login', login);

// Protected routes — no OTP limiter here
router.use(protect);

// Registration completion: needs auth but not approval (onboarding_status is 'incomplete')
router.put('/register/step2', validate(executiveRegisterStep2Schema), updateStep2);
router.put('/register/step3', updateStep3);

router.use(verifyApproved);
router.get('/dashboard', cacheMiddleware(10, true), getDashboard);
router.get('/my-partners', cacheMiddleware(3, true), getMyPartners);
router.get('/my-partners/:partnerId', getMyPartnerDetail);
router.get('/transactions', cacheMiddleware(5, true), getMyTransactions);
router.post('/withdraw', validate(withdrawalRequestSchema), idempotency, requestWithdrawal);
router.put('/profile', validate(executiveProfileUpdateSchema), updateProfile);
router.put('/bank-details', validate(executiveBankDetailsSchema), updateBankDetails);
router.get('/task-history', cacheMiddleware(10, true), getMyTaskHistory);
router.get('/salary', cacheMiddleware(10, true), getMySalary);

// ─── Attendance (GPS) ────────────────────────────────────────────────────────
router.post('/attendance/check-in', validate(gpsCheckinSchema), fieldExecutiveCheckIn);
router.post('/attendance/check-out', fieldExecutiveCheckOut);
router.get('/attendance/today', cacheMiddleware(10, true), getExecutiveTodayAttendance);
router.get('/attendance/history', cacheMiddleware(10, true), getExecutiveAttendance);

// ─── Targets ────────────────────────────────────────────────────────────────
router.get('/targets', cacheMiddleware(10, true), getExecutiveTargets);

// ─── Daily Reports ──────────────────────────────────────────────────────────
router.post('/reports/daily', validate(dailyReportSchema), submitExecutiveDailyReport);
router.get('/reports/history', cacheMiddleware(10, true), getExecutiveDailyReports);

// ─── Leaves ─────────────────────────────────────────────────────────────────
router.post('/leaves', validate(leaveRequestSchema), submitLeaveRequest);
router.get('/leaves', cacheMiddleware(10, true), getMyLeaves);

module.exports = router;

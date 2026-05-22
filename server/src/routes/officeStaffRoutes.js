const express = require('express');
const router = express.Router();
const { protect, authorizeRoles, verifyApproved } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { officeCheckinSchema, leaveRequestSchema, dailyReportSchema } = require('../utils/validators');
const {
  getOSDashboard,
  getOSTargets,
  submitOSDailyReport,
  getOSReports,
  getOSSalary,
  getOSProfile,
  updateOSProfile,
} = require('../controllers/staff/officeStaffController');
const {
  officeStaffCheckIn,
  officeStaffCheckOut,
  getOfficeStaffAttendance,
  submitLeaveRequest,
  getMyLeaves,
} = require('../controllers/staff/attendanceController');

router.use(protect);
router.use(authorizeRoles('office_staff'));
router.use(verifyApproved);

// ─── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', cacheMiddleware(10, true), getOSDashboard);

// ─── Attendance ─────────────────────────────────────────────────────────────
router.post('/attendance/check-in', validate(officeCheckinSchema), officeStaffCheckIn);
router.post('/attendance/check-out', officeStaffCheckOut);
router.get('/attendance/today', cacheMiddleware(10, true), async (req, res, next) => {
  try {
    const StaffAttendance = require('../models/StaffAttendance');
    const today = new Date().toISOString().split('T')[0];
    const record = await StaffAttendance.findOne({ staff_id: req.user.id, date: today }).lean();
    res.json({ success: true, data: record || null });
  } catch (err) { next(err); }
});
router.get('/attendance/history', cacheMiddleware(10, true), getOfficeStaffAttendance);

// ─── Targets ────────────────────────────────────────────────────────────────
router.get('/targets', cacheMiddleware(10, true), getOSTargets);

// ─── Daily Reports ──────────────────────────────────────────────────────────
router.post('/reports/daily', validate(dailyReportSchema), submitOSDailyReport);
router.get('/reports/history', cacheMiddleware(10, true), getOSReports);

// ─── Leaves ─────────────────────────────────────────────────────────────────
router.post('/leaves', validate(leaveRequestSchema), submitLeaveRequest);
router.get('/leaves', cacheMiddleware(10, true), getMyLeaves);

// ─── Salary ─────────────────────────────────────────────────────────────────
router.get('/salary', cacheMiddleware(10, true), getOSSalary);

// ─── Profile ────────────────────────────────────────────────────────────────
router.get('/profile', getOSProfile);
router.put('/profile', updateOSProfile);

module.exports = router;

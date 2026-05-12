const express = require('express');
const router = express.Router();
const { protect, authorizeRoles, verifyApproved } = require('../middlewares/authMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { leaveApprovalSchema, dailyReportSchema } = require('../utils/validators');
const {
  getTLDashboard,
  getTLExecutives,
  getTLOfficeStaff,
  getTLTargets,
  getTLSalary,
  getTLProfile,
  updateTLProfile,
  tlVerifyDailyReport,
  tlGetDailyReports,
  getTLPendingCounts,
} = require('../controllers/staff/teamLeaderController');
const {
  tlGetTeamAttendance,
  tlVerifyAttendance,
  tlGetTeamLeaves,
  tlApproveLeave,
  submitLeaveRequest,
  getMyLeaves,
} = require('../controllers/staff/attendanceController');

router.use(protect);
router.use(authorizeRoles('team_leader'));
router.use(verifyApproved);

// ─── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', cacheMiddleware(10, true), getTLDashboard);
router.get('/pending-counts', getTLPendingCounts);

// ─── Team Management ────────────────────────────────────────────────────────
router.get('/team/executives', cacheMiddleware(10, true), getTLExecutives);
router.get('/team/office-staff', cacheMiddleware(10, true), getTLOfficeStaff);

// ─── Targets ────────────────────────────────────────────────────────────────
router.get('/targets', cacheMiddleware(10, true), getTLTargets);

// ─── Attendance ─────────────────────────────────────────────────────────────
router.get('/attendance', cacheMiddleware(10, true), tlGetTeamAttendance);
router.put('/attendance/:id/verify', tlVerifyAttendance);

// ─── Leaves ─────────────────────────────────────────────────────────────────
router.get('/leaves/team', cacheMiddleware(10, true), tlGetTeamLeaves);
router.put('/leaves/:id', validate(leaveApprovalSchema), tlApproveLeave);
router.get('/leaves/my', cacheMiddleware(10, true), getMyLeaves);
router.post('/leaves', submitLeaveRequest);

// ─── Daily Reports ──────────────────────────────────────────────────────────
router.get('/reports', cacheMiddleware(10, true), tlGetDailyReports);
router.put('/reports/:id/verify', tlVerifyDailyReport);

// ─── Salary ─────────────────────────────────────────────────────────────────
router.get('/salary', cacheMiddleware(10, true), getTLSalary);

// ─── Profile ────────────────────────────────────────────────────────────────
router.get('/profile', getTLProfile);
router.put('/profile', updateTLProfile);

module.exports = router;

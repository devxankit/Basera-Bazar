const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const {
  teamLeaderSchema,
  teamLeaderUpdateSchema,
  officeStaffSchema,
  officeStaffUpdateSchema,
  targetAssignSchema,
  leaveApprovalSchema,
  salaryFinalizeSchema,
  idParamSchema,
} = require('../utils/validators');
const cacheMiddleware = require('../middlewares/cacheMiddleware');
const idempotency = require('../middlewares/idempotencyMiddleware');
const {
  getAllTeamLeaders,
  getTeamLeaderById,
  createTeamLeader,
  updateTeamLeader,
  toggleTeamLeaderActive,
  approveTeamLeader,
  rejectTeamLeader,
  updateTeamLeaderSalary,
  getTeamLeaderTeam,
  getAllOfficeStaff,
  getOfficeStaffById,
  createOfficeStaff,
  updateOfficeStaff,
  toggleOfficeStaffActive,
  approveOfficeStaff,
  rejectOfficeStaff,
  reassignOfficeStaff,
  assignExecutiveToTL,
  getAllTargets,
  createTarget,
  updateTarget,
  toggleTargetStatus,
  deleteTarget,
  getTargetProgress,
  getStaffStats,
  getAllLeaves,
  adminApproveLeave,
  getStaffPerformance,
  finalizeMonthPerformance,
  getStaffSalaryRecords,
  processMonthlyStaffSalary,
  markSalaryPaid,
  getStaffLeaderboard,
  getAllAttendance,
  adminVerifyAttendance,
  getAllDailyReports,
  adminVerifyDailyReport,
  exportAttendanceToCSV,
  exportReportsToCSV,
} = require('../controllers/staff/adminStaffController');
const { generateSalarySlip } = require('../utils/pdfGenerator');
const SalaryRecord = require('../models/SalaryRecord');
const { TeamLeader, OfficeStaff } = require('../models/Staff');
const Executive = require('../models/Executive');
const logger = require('../utils/logger');

router.use(protect);
router.use(authorizeRoles('super_admin'));

// ─── Stats ─────────────────────────────────────────────────────────────────
router.get('/stats', cacheMiddleware(5, true), getStaffStats);

// ─── Team Leaders ───────────────────────────────────────────────────────────
router.get('/team-leaders', cacheMiddleware(5, true), getAllTeamLeaders);
router.post('/team-leaders', validate(teamLeaderSchema), createTeamLeader);
router.get('/team-leaders/:id', getTeamLeaderById);
router.put('/team-leaders/:id', validate(teamLeaderUpdateSchema), updateTeamLeader);
router.put('/team-leaders/:id/toggle', toggleTeamLeaderActive);
router.put('/team-leaders/:id/approve', approveTeamLeader);
router.put('/team-leaders/:id/reject', rejectTeamLeader);
router.put('/team-leaders/:id/salary', updateTeamLeaderSalary);
router.get('/team-leaders/:id/team', getTeamLeaderTeam);

// ─── Office Staff ───────────────────────────────────────────────────────────
router.get('/office-staff', cacheMiddleware(5, true), getAllOfficeStaff);
router.post('/office-staff', validate(officeStaffSchema), createOfficeStaff);
router.get('/office-staff/:id', getOfficeStaffById);
router.put('/office-staff/:id', validate(officeStaffUpdateSchema), updateOfficeStaff);
router.put('/office-staff/:id/toggle', toggleOfficeStaffActive);
router.put('/office-staff/:id/approve', approveOfficeStaff);
router.put('/office-staff/:id/reject', rejectOfficeStaff);
router.put('/office-staff/:id/reassign', reassignOfficeStaff);

// ─── Executive → Team Leader assignment ────────────────────────────────────
router.put('/executives/:id/assign-tl', assignExecutiveToTL);

// ─── Targets ────────────────────────────────────────────────────────────────
router.get('/targets', cacheMiddleware(5, true), getAllTargets);
router.post('/targets', validate(targetAssignSchema), createTarget);
router.put('/targets/:id', updateTarget);
router.put('/targets/:id/toggle', toggleTargetStatus);
router.delete('/targets/:id', deleteTarget);
router.get('/targets/:id/progress', getTargetProgress);

// ─── Attendance ─────────────────────────────────────────────────────────────
router.get('/attendance', cacheMiddleware(5, true), getAllAttendance);
router.get('/attendance/export', exportAttendanceToCSV);
router.put('/attendance/:id/verify', adminVerifyAttendance);

// ─── Leaves ─────────────────────────────────────────────────────────────────
router.get('/leaves', cacheMiddleware(5, true), getAllLeaves);
router.put('/leaves/:id', validate(leaveApprovalSchema), adminApproveLeave);

// ─── Performance ────────────────────────────────────────────────────────────
router.get('/performance', cacheMiddleware(5, true), getStaffPerformance);
router.post('/performance/finalize', finalizeMonthPerformance);

// ─── Salary ─────────────────────────────────────────────────────────────────
router.get('/salary', cacheMiddleware(5, true), getStaffSalaryRecords);
router.post('/salary/process-monthly', idempotency, processMonthlyStaffSalary);
router.put('/salary/:id/pay', validate(salaryFinalizeSchema), markSalaryPaid);
router.get('/salary/:id/slip', async (req, res) => {
  try {
    const record = await SalaryRecord.findById(req.params.id).lean();
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });

    let staffName = 'Staff Member';
    let staffRole = record.staff_type || 'executive';
    if (record.staff_type === 'team_leader') {
      const tl = await TeamLeader.findById(record.staff_id).select('name').lean();
      staffName = tl?.name || staffName;
    } else if (record.staff_type === 'office_staff') {
      const os = await OfficeStaff.findById(record.staff_id).select('name').lean();
      staffName = os?.name || staffName;
    } else {
      const exec = await Executive.findById(record.executive_id || record.staff_id).select('name').lean();
      staffName = exec?.name || staffName;
      staffRole = 'field_executive';
    }

    const pdfBuffer = await generateSalarySlip({
      staff_name: staffName,
      staff_role: staffRole,
      staff_id: (record.staff_id || record.executive_id || '').toString(),
      month: record.month,
      base_salary: record.base_salary,
      incentive_amount: record.incentive_amount,
      team_commission_amount: record.team_commission_amount,
      deduction_amount: record.deduction_amount,
      effective_salary: record.effective_salary,
      status: record.status,
      paid_at: record.paid_at,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=salary-slip-${staffName.replace(/\s+/g, '-')}-${record.month}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    logger.error({ err }, 'generateSalarySlip Error');
    res.status(500).json({ success: false, message: 'Error generating salary slip.' });
  }
});

// ─── Leaderboard ────────────────────────────────────────────────────────────
router.get('/leaderboard', cacheMiddleware(5, true), getStaffLeaderboard);

// ─── Daily Reports ──────────────────────────────────────────────────────────
router.get('/reports/daily', cacheMiddleware(5, true), getAllDailyReports);
router.get('/reports/daily/export', exportReportsToCSV);
router.put('/reports/daily/:id/verify', adminVerifyDailyReport);

module.exports = router;

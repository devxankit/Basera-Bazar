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
  targetUpdateSchema,
  attendanceVerifySchema,
  reportVerifySchema,
} = require('../utils/validators');

const vId = validate(idParamSchema, 'params');
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
  transferExecutiveLeads,
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
router.get('/team-leaders/:id', vId, getTeamLeaderById);
router.put('/team-leaders/:id', vId, validate(teamLeaderUpdateSchema), updateTeamLeader);
router.put('/team-leaders/:id/toggle', vId, toggleTeamLeaderActive);
router.put('/team-leaders/:id/approve', vId, approveTeamLeader);
router.put('/team-leaders/:id/reject', vId, rejectTeamLeader);
router.put('/team-leaders/:id/salary', vId, updateTeamLeaderSalary);
router.get('/team-leaders/:id/team', vId, getTeamLeaderTeam);

// ─── Office Staff ───────────────────────────────────────────────────────────
router.get('/office-staff', cacheMiddleware(5, true), getAllOfficeStaff);
router.post('/office-staff', validate(officeStaffSchema), createOfficeStaff);
router.get('/office-staff/:id', vId, getOfficeStaffById);
router.put('/office-staff/:id', vId, validate(officeStaffUpdateSchema), updateOfficeStaff);
router.put('/office-staff/:id/toggle', vId, toggleOfficeStaffActive);
router.put('/office-staff/:id/approve', vId, approveOfficeStaff);
router.put('/office-staff/:id/reject', vId, rejectOfficeStaff);
router.put('/office-staff/:id/reassign', vId, reassignOfficeStaff);

// ─── Executive → Team Leader assignment ────────────────────────────────────
router.put('/executives/:id/assign-tl', vId, assignExecutiveToTL);

// ─── Executive Lead Transfer ─────────────────────────────────────────────────
router.post('/executives/:id/transfer-leads', vId, transferExecutiveLeads);

// ─── Targets ────────────────────────────────────────────────────────────────
router.get('/targets', cacheMiddleware(5, true), getAllTargets);
router.post('/targets', validate(targetAssignSchema), createTarget);
router.put('/targets/:id', vId, validate(targetUpdateSchema), updateTarget);
router.put('/targets/:id/toggle', vId, toggleTargetStatus);
router.delete('/targets/:id', vId, deleteTarget);
router.get('/targets/:id/progress', vId, getTargetProgress);

// ─── Attendance ─────────────────────────────────────────────────────────────
router.get('/attendance', cacheMiddleware(5, true), getAllAttendance);
router.get('/attendance/export', exportAttendanceToCSV);
router.put('/attendance/:id/verify', vId, validate(attendanceVerifySchema), adminVerifyAttendance);

// ─── Leaves ─────────────────────────────────────────────────────────────────
router.get('/leaves', cacheMiddleware(5, true), getAllLeaves);
router.put('/leaves/:id', vId, validate(leaveApprovalSchema), adminApproveLeave);

// ─── Performance ────────────────────────────────────────────────────────────
router.get('/performance', cacheMiddleware(5, true), getStaffPerformance);
router.post('/performance/finalize', finalizeMonthPerformance);

// ─── Salary ─────────────────────────────────────────────────────────────────
router.get('/salary', cacheMiddleware(5, true), getStaffSalaryRecords);
router.post('/salary/process-monthly', idempotency, processMonthlyStaffSalary);
router.put('/salary/:id/pay', vId, validate(salaryFinalizeSchema), markSalaryPaid);
router.get('/salary/:id/slip', vId, async (req, res) => {
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
router.put('/reports/daily/:id/verify', vId, validate(reportVerifySchema), adminVerifyDailyReport);

module.exports = router;

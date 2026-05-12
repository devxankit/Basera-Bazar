const logger = require('../../utils/logger');
const { TeamLeader, OfficeStaff } = require('../../models/Staff');
const Executive = require('../../models/Executive');
const SalaryRecord = require('../../models/SalaryRecord');
const StaffTarget = require('../../models/StaffTarget');
const StaffPerformance = require('../../models/StaffPerformance');
const DailyReport = require('../../models/DailyReport');

const getTLDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    const StaffAttendance = require('../../models/StaffAttendance');
    const LeaveRequest = require('../../models/LeaveRequest');

    const [feCount, osCount, todayAttendance, pendingLeaves, pendingReports, myPerf] = await Promise.all([
      Executive.countDocuments({ team_leader_id: req.user.id, is_active: true }),
      OfficeStaff.countDocuments({ team_leader_id: req.user.id, is_active: true }),
      StaffAttendance.countDocuments({ team_leader_id: req.user.id, date: today, status: 'present' }),
      LeaveRequest.countDocuments({ team_leader_id: req.user.id, status: 'pending' }),
      DailyReport.countDocuments({ team_leader_id: req.user.id, status: 'submitted', date: today }),
      StaffPerformance.findOne({ staff_id: req.user.id, month }).lean(),
    ]);

    const [mySalary, tlProfile] = await Promise.all([
      SalaryRecord.findOne({ staff_id: req.user.id, staff_type: 'team_leader', month }).lean(),
      TeamLeader.findById(req.user.id).select('name').lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        name: tlProfile?.name,
        fe_count: feCount,
        os_count: osCount,
        today_present: todayAttendance,
        pending_leaves: pendingLeaves,
        pending_reports: pendingReports,
        performance: myPerf,
        salary: mySalary,
      },
    });
  } catch (err) {
    logger.error({ err }, 'getTLDashboard Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTLExecutives = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);
    const StaffAttendance = require('../../models/StaffAttendance');

    const executives = await Executive.find({ team_leader_id: req.user.id })
      .select('name phone email onboarding_status is_active salary')
      .lean();

    const enriched = await Promise.all(
      executives.map(async (exec) => {
        const [att, perf] = await Promise.all([
          StaffAttendance.findOne({ staff_id: exec._id, date: today }).lean(),
          StaffPerformance.findOne({ staff_id: exec._id, month }).lean(),
        ]);
        return { ...exec, today_attendance: att, monthly_performance: perf };
      })
    );

    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    logger.error({ err }, 'getTLExecutives Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTLOfficeStaff = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);
    const StaffAttendance = require('../../models/StaffAttendance');

    const officeStaff = await OfficeStaff.find({ team_leader_id: req.user.id })
      .select('name phone email onboarding_status is_active fixed_salary calling_specialization')
      .lean();

    const enriched = await Promise.all(
      officeStaff.map(async (os) => {
        const [att, perf] = await Promise.all([
          StaffAttendance.findOne({ staff_id: os._id, date: today }).lean(),
          StaffPerformance.findOne({ staff_id: os._id, month }).lean(),
        ]);
        return { ...os, today_attendance: att, monthly_performance: perf };
      })
    );

    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    logger.error({ err }, 'getTLOfficeStaff Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTLTargets = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const targets = await StaffTarget.find({
      is_active: true,
      end_date: { $gte: today },
      $or: [
        { assign_to_type: 'all' },
        { assign_to_type: 'team_leader' },
        { assign_to_type: 'team_leader', assign_to_ids: req.user.id },
      ],
    }).lean();
    res.status(200).json({ success: true, data: targets });
  } catch (err) {
    logger.error({ err }, 'getTLTargets Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTLSalary = async (req, res) => {
  try {
    const records = await SalaryRecord.find({ staff_id: req.user.id, staff_type: 'team_leader' })
      .sort({ month: -1 })
      .limit(12)
      .lean();
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    logger.error({ err }, 'getTLSalary Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTLProfile = async (req, res) => {
  try {
    const tl = await TeamLeader.findById(req.user.id).lean();
    if (!tl) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.status(200).json({ success: true, data: tl });
  } catch (err) {
    logger.error({ err }, 'getTLProfile Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateTLProfile = async (req, res) => {
  try {
    const { name, address, bank_details, profile_image } = req.body;
    const tl = await TeamLeader.findByIdAndUpdate(
      req.user.id,
      { name, address, bank_details, profile_image },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: tl.toJSON(), message: 'Profile updated.' });
  } catch (err) {
    logger.error({ err }, 'updateTLProfile Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const tlVerifyDailyReport = async (req, res) => {
  try {
    const { action, remarks } = req.body;
    const newStatus = action === 'approve' ? 'tl_verified' : 'tl_rejected';
    const report = await DailyReport.findOneAndUpdate(
      { _id: req.params.id, team_leader_id: req.user.id },
      { status: newStatus, tl_remarks: remarks, tl_verified_at: new Date() },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.status(200).json({ success: true, message: `Report ${action}d.` });
  } catch (err) {
    logger.error({ err }, 'tlVerifyDailyReport Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const tlGetDailyReports = async (req, res) => {
  try {
    const filter = { team_leader_id: req.user.id };
    if (req.query.date) filter.date = req.query.date;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.staff_type) filter.staff_type = req.query.staff_type;
    const reports = await DailyReport.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    logger.error({ err }, 'tlGetDailyReports Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTLPendingCounts = async (req, res) => {
  try {
    const StaffAttendance = require('../../models/StaffAttendance');
    const [pendingAttendance, pendingReports] = await Promise.all([
      StaffAttendance.countDocuments({ 
        team_leader_id: req.user.id, 
        verified_by_team_leader: false,
        status: { $in: ['present', 'half_day'] } 
      }),
      DailyReport.countDocuments({ 
        team_leader_id: req.user.id, 
        status: 'submitted' 
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        attendance: pendingAttendance,
        reports: pendingReports,
        total: pendingAttendance + pendingReports
      }
    });
  } catch (err) {
    logger.error({ err }, 'getTLPendingCounts Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
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
};

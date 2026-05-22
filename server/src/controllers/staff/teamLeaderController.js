const logger = require('../../utils/logger');
const { escapeRegex } = require('../../utils/listingUtils');
const { TeamLeader, OfficeStaff } = require('../../models/Staff');
const Executive = require('../../models/Executive');
const SalaryRecord = require('../../models/SalaryRecord');
const StaffTarget = require('../../models/StaffTarget');
const StaffPerformance = require('../../models/StaffPerformance');
const DailyReport = require('../../models/DailyReport');
const AuditLog = require('../../models/AuditLog');

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

    if (executives.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Bulk-fetch attendance and performance for all executives in two queries
    // instead of two queries per executive (N+1).
    const staffIds = executives.map(e => e._id);

    const [attendanceRecords, perfRecords] = await Promise.all([
      StaffAttendance.find({ staff_id: { $in: staffIds }, date: today }).lean(),
      StaffPerformance.find({ staff_id: { $in: staffIds }, month }).lean(),
    ]);

    const attMap = new Map(attendanceRecords.map(a => [a.staff_id.toString(), a]));
    const perfMap = new Map(perfRecords.map(p => [p.staff_id.toString(), p]));

    const enriched = executives.map(exec => ({
      ...exec,
      today_attendance: attMap.get(exec._id.toString()) || null,
      monthly_performance: perfMap.get(exec._id.toString()) || null,
    }));

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

    if (officeStaff.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Bulk-fetch attendance and performance for all office staff in two queries
    // instead of two queries per member (N+1).
    const staffIds = officeStaff.map(os => os._id);

    const [attendanceRecords, perfRecords] = await Promise.all([
      StaffAttendance.find({ staff_id: { $in: staffIds }, date: today }).lean(),
      StaffPerformance.find({ staff_id: { $in: staffIds }, month }).lean(),
    ]);

    const attMap = new Map(attendanceRecords.map(a => [a.staff_id.toString(), a]));
    const perfMap = new Map(perfRecords.map(p => [p.staff_id.toString(), p]));

    const enriched = officeStaff.map(os => ({
      ...os,
      today_attendance: attMap.get(os._id.toString()) || null,
      monthly_performance: perfMap.get(os._id.toString()) || null,
    }));

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

// ─── Admin: Team Leader Management ──────────────────────────────────────────

const getAllTeamLeaders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.state) filter.state = new RegExp(escapeRegex(req.query.state), 'i');
    if (req.query.status) filter.onboarding_status = req.query.status;
    if (req.query.search) {
      const re = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ name: re }, { phone: re }, { email: re }];
    }

    const pipeline = [
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'executives',
          localField: '_id',
          foreignField: 'team_leader_id',
          pipeline: [{ $match: { is_active: true } }],
          as: 'executives'
        }
      },
      {
        $lookup: {
          from: 'officestaffs',
          localField: '_id',
          foreignField: 'team_leader_id',
          pipeline: [{ $match: { is_active: true } }],
          as: 'office_staff'
        }
      },
      {
        $addFields: {
          fe_count: { $size: '$executives' },
          os_count: { $size: '$office_staff' },
          team_size: { $add: [{ $size: '$executives' }, { $size: '$office_staff' }] }
        }
      },
      {
        $project: { executives: 0, office_staff: 0 }
      }
    ];

    const [total, teamLeaders] = await Promise.all([
      TeamLeader.countDocuments(filter),
      TeamLeader.aggregate(pipeline)
    ]);

    res.status(200).json({ success: true, data: teamLeaders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, 'getAllTeamLeaders Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTeamLeaderById = async (req, res) => {
  try {
    const tl = await TeamLeader.findById(req.params.id).lean();
    if (!tl) return res.status(404).json({ success: false, message: 'Team Leader not found.' });

    const [feCount, osCount, salaryHistory, executives, officeStaff, performance] = await Promise.all([
      Executive.countDocuments({ team_leader_id: tl._id }),
      OfficeStaff.countDocuments({ team_leader_id: tl._id }),
      SalaryRecord.find({ staff_id: tl._id, staff_type: 'team_leader' }).sort({ month: -1 }).limit(12).lean(),
      Executive.find({ team_leader_id: tl._id }).select('name phone is_active onboarding_status').lean(),
      OfficeStaff.find({ team_leader_id: tl._id }).select('name phone is_active onboarding_status calling_specialization').lean(),
      require('../../models/StaffPerformance').findOne({ staff_id: tl._id }).sort({ month: -1 }).lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...tl,
        fe_count: feCount,
        os_count: osCount,
        salary_history: salaryHistory,
        executives,
        office_staff: officeStaff,
        performance
      },
    });
  } catch (err) {
    logger.error({ err }, 'getTeamLeaderById Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createTeamLeader = async (req, res) => {
  try {
    const existing = await TeamLeader.findOne({
      $or: [{ phone: req.body.phone }, { email: req.body.email.toLowerCase() }],
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Phone or email already in use.' });
    }

    const tl = await TeamLeader.create({
      ...req.body,
      onboarding_status: 'approved',
    });

    res.status(201).json({ success: true, data: tl.toJSON(), message: 'Team Leader created successfully.' });
  } catch (err) {
    logger.error({ err }, 'createTeamLeader Error');
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Phone or email already in use.' });
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateTeamLeader = async (req, res) => {
  try {
    // Prevent mass-assignment (B-2)
    const {
      name, phone, email, state, district, zone, address,
      bank_details, profile_image
    } = req.body;

    const updateData = {
      name, phone, email, state, district, zone, address,
      bank_details, profile_image
    };

    const tl = await TeamLeader.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true });
    if (!tl) return res.status(404).json({ success: false, message: 'Team Leader not found.' });
    res.status(200).json({ success: true, data: tl.toJSON(), message: 'Team Leader updated.' });
  } catch (err) {
    logger.error({ err }, 'updateTeamLeader Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const toggleTeamLeaderActive = async (req, res) => {
  try {
    const tl = await TeamLeader.findById(req.params.id);
    if (!tl) return res.status(404).json({ success: false, message: 'Team Leader not found.' });
    tl.is_active = !tl.is_active;
    if (!tl.is_active) tl.deactivated_at = new Date();
    await tl.save();
    res.status(200).json({ success: true, data: { is_active: tl.is_active }, message: `Team Leader ${tl.is_active ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    logger.error({ err }, 'toggleTeamLeaderActive Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const approveTeamLeader = async (req, res) => {
  try {
    const tl = await TeamLeader.findByIdAndUpdate(
      req.params.id,
      { $set: { onboarding_status: 'approved' } },
      { new: true }
    );
    if (!tl) return res.status(404).json({ success: false, message: 'Team Leader not found.' });

    await AuditLog.create({
      admin_id: req.user.id,
      action: 'APPROVE_TL',
      resource_id: tl._id,
      resource_type: 'TeamLeader',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(200).json({ success: true, message: 'Team Leader approved.' });
  } catch (err) {
    logger.error({ err }, 'approveTeamLeader Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const rejectTeamLeader = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    const tl = await TeamLeader.findByIdAndUpdate(
      req.params.id,
      { onboarding_status: 'rejected', deactivation_reason: reason },
      { new: true }
    );
    if (!tl) return res.status(404).json({ success: false, message: 'Team Leader not found.' });

    await AuditLog.create({
      admin_id: req.user.id,
      action: 'REJECT_TL',
      resource_id: tl._id,
      resource_type: 'TeamLeader',
      details: { reason },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(200).json({ success: true, message: 'Team Leader rejected.' });
  } catch (err) {
    logger.error({ err }, 'rejectTeamLeader Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateTeamLeaderSalary = async (req, res) => {
  try {
    const { fixed_salary, commission_rate } = req.body;
    const tl = await TeamLeader.findByIdAndUpdate(
      req.params.id,
      { fixed_salary, commission_rate },
      { new: true, runValidators: true }
    );
    if (!tl) return res.status(404).json({ success: false, message: 'Team Leader not found.' });
    res.status(200).json({ success: true, message: 'Salary structure updated.' });
  } catch (err) {
    logger.error({ err }, 'updateTeamLeaderSalary Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTeamLeaderTeam = async (req, res) => {
  try {
    const [executives, officeStaff] = await Promise.all([
      Executive.find({ team_leader_id: req.params.id }).select('name phone email onboarding_status is_active salary').lean(),
      OfficeStaff.find({ team_leader_id: req.params.id }).select('name phone email onboarding_status is_active fixed_salary calling_specialization').lean(),
    ]);
    res.status(200).json({ success: true, data: { executives, office_staff: officeStaff } });
  } catch (err) {
    logger.error({ err }, 'getTeamLeaderTeam Error');
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
  // Admin management
  getAllTeamLeaders,
  getTeamLeaderById,
  createTeamLeader,
  updateTeamLeader,
  toggleTeamLeaderActive,
  approveTeamLeader,
  rejectTeamLeader,
  updateTeamLeaderSalary,
  getTeamLeaderTeam,
};

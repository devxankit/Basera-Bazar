const logger = require('../../utils/logger');
const { escapeRegex } = require('../../utils/listingUtils');
const { TeamLeader, OfficeStaff } = require('../../models/Staff');
const Executive = require('../../models/Executive');
const SalaryRecord = require('../../models/SalaryRecord');
const StaffTarget = require('../../models/StaffTarget');
const StaffPerformance = require('../../models/StaffPerformance');
const DailyReport = require('../../models/DailyReport');
const StaffAttendance = require('../../models/StaffAttendance');
const AuditLog = require('../../models/AuditLog');

const getOSDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    const [todayAttendance, todayReport, monthPerf, monthSalary] = await Promise.all([
      StaffAttendance.findOne({ staff_id: req.user.id, date: today }).lean(),
      DailyReport.findOne({ staff_id: req.user.id, date: today }).lean(),
      StaffPerformance.findOne({ staff_id: req.user.id, month }).lean(),
      SalaryRecord.findOne({ staff_id: req.user.id, month }).lean(),
    ]);

    const activeTargets = await StaffTarget.find({
      is_active: true,
      end_date: { $gte: today },
      $or: [
        { assign_to_type: 'all' },
        { assign_to_type: 'office_staff' },
        { assign_to_type: 'office_staff', assign_to_ids: req.user.id },
      ],
    }).lean();

    res.status(200).json({
      success: true,
      data: {
        today_attendance: todayAttendance,
        today_report: todayReport,
        active_targets: activeTargets,
        performance: monthPerf,
        salary: monthSalary,
      },
    });
  } catch (err) {
    logger.error({ err }, 'getOSDashboard Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOSTargets = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const targets = await StaffTarget.find({
      is_active: true,
      end_date: { $gte: today },
      $or: [
        { assign_to_type: 'all' },
        { assign_to_type: 'office_staff' },
        { assign_to_type: 'office_staff', assign_to_ids: req.user.id },
      ],
    }).lean();
    res.status(200).json({ success: true, data: targets });
  } catch (err) {
    logger.error({ err }, 'getOSTargets Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const submitOSDailyReport = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const os = await OfficeStaff.findById(req.user.id).select('team_leader_id').lean();

    const existing = await DailyReport.findOne({ staff_id: req.user.id, date: today });
    if (existing && existing.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Daily report already submitted for today.' });
    }

    const report = await DailyReport.findOneAndUpdate(
      { staff_id: req.user.id, date: today },
      {
        staff_id: req.user.id,
        staff_type: 'office_staff',
        team_leader_id: os?.team_leader_id || null,
        date: today,
        ...req.body,
        status: 'submitted',
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: report, message: 'Daily report submitted.' });
  } catch (err) {
    logger.error({ err }, 'submitOSDailyReport Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOSReports = async (req, res) => {
  try {
    const filter = { staff_id: req.user.id };
    if (req.query.month) {
      const [year, mon] = req.query.month.split('-');
      const lastDay = new Date(Number(year), Number(mon), 0).getDate();
      filter.date = { $gte: `${year}-${mon}-01`, $lte: `${year}-${mon}-${String(lastDay).padStart(2, '0')}` };
    }
    const reports = await DailyReport.find(filter).sort({ date: -1 }).lean();
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    logger.error({ err }, 'getOSReports Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOSSalary = async (req, res) => {
  try {
    const records = await SalaryRecord.find({ staff_id: req.user.id, staff_type: 'office_staff' })
      .sort({ month: -1 })
      .limit(12)
      .lean();
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    logger.error({ err }, 'getOSSalary Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOSProfile = async (req, res) => {
  try {
    const os = await OfficeStaff.findById(req.user.id).populate('team_leader_id', 'name phone state').lean();
    if (!os) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.status(200).json({ success: true, data: os });
  } catch (err) {
    logger.error({ err }, 'getOSProfile Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateOSProfile = async (req, res) => {
  try {
    const { name, address, bank_details, profile_image } = req.body;
    const os = await OfficeStaff.findByIdAndUpdate(
      req.user.id,
      { name, address, bank_details, profile_image },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: os.toJSON(), message: 'Profile updated.' });
  } catch (err) {
    logger.error({ err }, 'updateOSProfile Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Admin: Office Staff Management ─────────────────────────────────────────

const getAllOfficeStaff = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.team_leader_id) filter.team_leader_id = req.query.team_leader_id;
    if (req.query.status) filter.onboarding_status = req.query.status;
    if (req.query.specialization) filter.calling_specialization = req.query.specialization;
    if (req.query.search) {
      const re = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ name: re }, { phone: re }, { email: re }];
    }

    const [total, officeStaff] = await Promise.all([
      OfficeStaff.countDocuments(filter),
      OfficeStaff.find(filter)
        .populate('team_leader_id', 'name phone state')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({ success: true, data: officeStaff, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, 'getAllOfficeStaff Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOfficeStaffById = async (req, res) => {
  try {
    const os = await OfficeStaff.findById(req.params.id).populate('team_leader_id', 'name phone state').lean();
    if (!os) return res.status(404).json({ success: false, message: 'Office Staff not found.' });

    const salaryHistory = await SalaryRecord.find({ staff_id: os._id, staff_type: 'office_staff' }).sort({ month: -1 }).limit(12).lean();
    res.status(200).json({ success: true, data: { ...os, salary_history: salaryHistory } });
  } catch (err) {
    logger.error({ err }, 'getOfficeStaffById Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createOfficeStaff = async (req, res) => {
  try {
    const existing = await OfficeStaff.findOne({
      $or: [{ phone: req.body.phone }, { email: req.body.email.toLowerCase() }],
    });
    if (existing) return res.status(409).json({ success: false, message: 'Phone or email already in use.' });

    const os = await OfficeStaff.create({ ...req.body, onboarding_status: 'approved' });
    res.status(201).json({ success: true, data: os.toJSON(), message: 'Office Staff created successfully.' });
  } catch (err) {
    logger.error({ err }, 'createOfficeStaff Error');
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Phone or email already in use.' });
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateOfficeStaff = async (req, res) => {
  try {
    // Prevent mass-assignment (B-2)
    const {
      name, phone, email, calling_specialization, address,
      bank_details, profile_image
    } = req.body;

    const updateData = {
      name, phone, email, calling_specialization, address,
      bank_details, profile_image
    };

    const os = await OfficeStaff.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!os) return res.status(404).json({ success: false, message: 'Office Staff not found.' });
    res.status(200).json({ success: true, data: os.toJSON(), message: 'Office Staff updated.' });
  } catch (err) {
    logger.error({ err }, 'updateOfficeStaff Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const toggleOfficeStaffActive = async (req, res) => {
  try {
    const os = await OfficeStaff.findById(req.params.id);
    if (!os) return res.status(404).json({ success: false, message: 'Office Staff not found.' });
    os.is_active = !os.is_active;
    if (!os.is_active) os.deactivated_at = new Date();
    await os.save();
    res.status(200).json({ success: true, data: { is_active: os.is_active }, message: `Office Staff ${os.is_active ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    logger.error({ err }, 'toggleOfficeStaffActive Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const approveOfficeStaff = async (req, res) => {
  try {
    const os = await OfficeStaff.findByIdAndUpdate(req.params.id, { $set: { onboarding_status: 'approved' } }, { new: true });
    if (!os) return res.status(404).json({ success: false, message: 'Office Staff not found.' });

    await AuditLog.create({
      admin_id: req.user.id,
      action: 'APPROVE_OS',
      resource_id: os._id,
      resource_type: 'OfficeStaff',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(200).json({ success: true, message: 'Office Staff approved.' });
  } catch (err) {
    logger.error({ err }, 'approveOfficeStaff Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const rejectOfficeStaff = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    const os = await OfficeStaff.findByIdAndUpdate(req.params.id, { $set: { onboarding_status: 'rejected', deactivation_reason: reason } }, { new: true });
    if (!os) return res.status(404).json({ success: false, message: 'Office Staff not found.' });

    await AuditLog.create({
      admin_id: req.user.id,
      action: 'REJECT_OS',
      resource_id: os._id,
      resource_type: 'OfficeStaff',
      details: { reason },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(200).json({ success: true, message: 'Office Staff rejected.' });
  } catch (err) {
    logger.error({ err }, 'rejectOfficeStaff Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const reassignOfficeStaff = async (req, res) => {
  try {
    const { new_team_leader_id } = req.body;
    if (!new_team_leader_id) return res.status(400).json({ success: false, message: 'new_team_leader_id is required.' });
    const tl = await TeamLeader.findById(new_team_leader_id);
    if (!tl) return res.status(404).json({ success: false, message: 'Target Team Leader not found.' });
    const os = await OfficeStaff.findByIdAndUpdate(req.params.id, { $set: { team_leader_id: new_team_leader_id } }, { new: true });
    if (!os) return res.status(404).json({ success: false, message: 'Office Staff not found.' });
    res.status(200).json({ success: true, message: `Office Staff reassigned to ${tl.name}.` });
  } catch (err) {
    logger.error({ err }, 'reassignOfficeStaff Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const assignExecutiveToTL = async (req, res) => {
  try {
    const { team_leader_id } = req.body;
    if (!team_leader_id) return res.status(400).json({ success: false, message: 'team_leader_id is required.' });
    const tl = await TeamLeader.findById(team_leader_id);
    if (!tl) return res.status(404).json({ success: false, message: 'Team Leader not found.' });
    const exec = await Executive.findByIdAndUpdate(req.params.id, { $set: { team_leader_id } }, { new: true });
    if (!exec) return res.status(404).json({ success: false, message: 'Executive not found.' });
    res.status(200).json({ success: true, message: `Executive assigned to ${tl.name}.` });
  } catch (err) {
    logger.error({ err }, 'assignExecutiveToTL Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getOSDashboard,
  getOSTargets,
  submitOSDailyReport,
  getOSReports,
  getOSSalary,
  getOSProfile,
  updateOSProfile,
  // Admin management
  getAllOfficeStaff,
  getOfficeStaffById,
  createOfficeStaff,
  updateOfficeStaff,
  toggleOfficeStaffActive,
  approveOfficeStaff,
  rejectOfficeStaff,
  reassignOfficeStaff,
  assignExecutiveToTL,
};

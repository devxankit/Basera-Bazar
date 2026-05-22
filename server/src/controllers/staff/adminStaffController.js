const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const { TeamLeader, OfficeStaff } = require('../../models/Staff');
const Executive = require('../../models/Executive');
const { Partner } = require('../../models/Partner');
const SalaryRecord = require('../../models/SalaryRecord');
const StaffTarget = require('../../models/StaffTarget');
const StaffPerformance = require('../../models/StaffPerformance');
const StaffAttendance = require('../../models/StaffAttendance');
const LeaveRequest = require('../../models/LeaveRequest');
const DailyReport = require('../../models/DailyReport');
const AuditLog = require('../../models/AuditLog');
const { checkLockout, recordFailedAttempt, resetFailedAttempts } = require('../../utils/loginLockout');
const { signAccessToken, signRefreshToken, setAuthCookies } = require('../../utils/cookieAuth');
const invalidate = require('../../utils/cacheInvalidator');

// ─── Staff Unified Login ─────────────────────────────────────────────────────

const staffLogin = async (req, res) => {
  const { identifier, password, role } = req.body;
  try {
    let Model;
    if (role === 'team_leader') Model = TeamLeader;
    else if (role === 'office_staff') Model = OfficeStaff;
    else if (role === 'executive') Model = Executive;
    else return res.status(400).json({ success: false, message: 'Invalid role specified.' });

    const query = /^[6-9]\d{9}$/.test(identifier)
      ? { phone: identifier }
      : { email: identifier.toLowerCase() };

    const staff = await Model.findOne(query);
    if (!staff) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const lockout = checkLockout(staff);
    if (lockout.locked) {
      return res.status(429).json({
        success: false,
        message: `Account locked. Try again after ${lockout.retryAfter.toLocaleTimeString()}.`,
      });
    }

    if (!['approved', 'verified'].includes(staff.onboarding_status)) {
      return res.status(403).json({ success: false, message: 'Your account is not yet approved.' });
    }

    if (!staff.is_active) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    const isMatch = await staff.matchPassword(password);
    if (!isMatch) {
      await recordFailedAttempt(Model, staff._id);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    await resetFailedAttempts(Model, staff._id);

    const accessToken  = signAccessToken(staff._id, role, staff.email, staff.token_version);
    const refreshTokenVal = signRefreshToken(staff._id, role, staff.token_version);
    setAuthCookies(res, accessToken, refreshTokenVal);

    const {
      _id, name, phone, email, profile_image, onboarding_status,
      is_active, state, calling_specialization, fixed_salary, commission_rate
    } = staff.toJSON();

    res.status(200).json({
      success: true,
      token: accessToken, // kept for localStorage fallback on older clients
      user: {
        _id, name, phone, email, profile_image, onboarding_status,
        is_active, state, calling_specialization, fixed_salary, commission_rate, role
      }
    });
  } catch (err) {
    logger.error({ err }, 'staffLogin Error');
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

const staffLogout = async (req, res) => {
  try {
    const { role, id } = req.user;
    let Model;
    if (role === 'team_leader') Model = TeamLeader;
    else if (role === 'office_staff') Model = OfficeStaff;
    else Model = Executive;

    await Model.findByIdAndUpdate(id, { $inc: { token_version: 1 } });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    logger.error({ err }, 'staffLogout Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getStaffMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

const changeStaffPassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const { role, id } = req.user;
    let Model;
    if (role === 'team_leader') Model = TeamLeader;
    else if (role === 'office_staff') Model = OfficeStaff;
    else Model = Executive;

    const staff = await Model.findById(id).select('+password');
    if (!staff) return res.status(404).json({ success: false, message: 'Not found.' });

    const isMatch = await staff.matchPassword(current_password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    staff.password = new_password;
    await staff.save();

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    logger.error({ err }, 'changeStaffPassword Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const staffForgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required.' });

    // Check in all staff models
    const [tl, os, fe] = await Promise.all([
      TeamLeader.findOne({ phone, onboarding_status: 'approved', is_active: true }),
      OfficeStaff.findOne({ phone, onboarding_status: 'approved', is_active: true }),
      Executive.findOne({ phone, onboarding_status: { $in: ['approved', 'verified'] }, is_active: true }),
    ]);

    const staff = tl || os || fe;
    if (!staff) return res.status(404).json({ success: false, message: 'Active staff account not found with this phone.' });

    const crypto = require('crypto');
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, salt);
    
    const { Otp } = require('../../models/User');

    await Otp.deleteMany({ phone });
    await Otp.create({
      phone,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
    });

    await require('../../utils/sms').sendOTP(phone, otpCode);

    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (err) {
    logger.error({ err }, 'staffForgotPassword Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const staffResetPassword = async (req, res) => {
  try {
    const { phone, otp, new_password } = req.body;
    if (!phone || !otp || !new_password) return res.status(400).json({ success: false, message: 'Phone, OTP and new password required.' });

    const { Otp } = require('../../models/User');
    const otpRecord = await Otp.findOne({ phone }).sort({ createdAt: -1 });

    if (!otpRecord || otpRecord.expires_at < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid OTP.' });

    // Find staff again to update
    const [tl, os, fe] = await Promise.all([
      TeamLeader.findOne({ phone }),
      OfficeStaff.findOne({ phone }),
      Executive.findOne({ phone }),
    ]);

    const staff = tl || os || fe;
    if (!staff) return res.status(404).json({ success: false, message: 'Staff account not found.' });

    staff.password = new_password;
    staff.token_version = (staff.token_version || 0) + 1; // Logout all sessions
    await staff.save();

    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ success: true, message: 'Password reset successfully. Please login with new password.' });
  } catch (err) {
    logger.error({ err }, 'staffResetPassword Error');
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
    if (req.query.state) filter.state = new RegExp(req.query.state, 'i');
    if (req.query.status) filter.onboarding_status = req.query.status;
    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
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
      const re = new RegExp(req.query.search, 'i');
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

// ─── Admin: Target Management ────────────────────────────────────────────────

const getAllTargets = async (req, res) => {
  try {
    const filter = {};
    if (req.query.active === 'true') filter.is_active = true;
    if (req.query.type) filter.target_type = req.query.type;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, targets] = await Promise.all([
      StaffTarget.countDocuments(filter),
      StaffTarget.find(filter)
        .populate('assigned_by', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({ success: true, data: targets, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, 'getAllTargets Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createTarget = async (req, res) => {
  try {
    const target = await StaffTarget.create({ ...req.body, assigned_by: req.user.id });
    
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'CREATE_TARGET',
      resource_id: target._id,
      resource_type: 'StaffTarget',
      details: req.body,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await invalidate.adminStaff();
    res.status(201).json({ success: true, data: target, message: 'Target assigned successfully.' });
  } catch (err) {
    logger.error({ err }, 'createTarget Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateTarget = async (req, res) => {
  try {
    const { target_type, target_period, target_value, start_date, end_date, description, incentive_type, incentive_rate, assign_to_type, assign_to_ids } = req.body;
    const target = await StaffTarget.findByIdAndUpdate(req.params.id, { target_type, target_period, target_value, start_date, end_date, description, incentive_type, incentive_rate, assign_to_type, assign_to_ids }, { new: true, runValidators: true });
    if (!target) return res.status(404).json({ success: false, message: 'Target not found.' });
    
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'UPDATE_TARGET',
      resource_id: target._id,
      resource_type: 'StaffTarget',
      details: req.body,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await invalidate.adminStaff();
    res.status(200).json({ success: true, data: target, message: 'Target updated.' });
  } catch (err) {
    logger.error({ err }, 'updateTarget Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const toggleTargetStatus = async (req, res) => {
  try {
    const target = await StaffTarget.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found.' });
    
    target.is_active = !target.is_active;
    await target.save();
    
    await AuditLog.create({
      admin_id: req.user.id,
      action: target.is_active ? 'ACTIVATE_TARGET' : 'DEACTIVATE_TARGET',
      resource_id: target._id,
      resource_type: 'StaffTarget',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await invalidate.adminStaff();
    res.status(200).json({ success: true, message: `Target ${target.is_active ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    logger.error({ err }, 'toggleTargetStatus Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteTarget = async (req, res) => {
  try {
    const target = await StaffTarget.findByIdAndDelete(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found.' });

    await AuditLog.create({
      admin_id: req.user.id,
      action: 'DELETE_TARGET',
      resource_id: target._id,
      resource_type: 'StaffTarget',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await invalidate.adminStaff();
    res.status(200).json({ success: true, message: 'Target deleted successfully.' });
  } catch (err) {
    logger.error({ err }, 'deleteTarget Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTargetProgress = async (req, res) => {
  try {
    const target = await StaffTarget.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found.' });

    // Identify staff covered by this target
    const assignType = target.assign_to_type;
    const assignIds = target.assign_to_ids || [];

    const getQuery = (_type) => {
      const q = { onboarding_status: { $in: ['approved', 'verified'] }, is_active: true };
      if (assignIds.length > 0) q._id = { $in: assignIds };
      return q;
    };

    const [tls, osse, execs] = await Promise.all([
      (assignType === 'all' || assignType === 'team_leader') ? TeamLeader.find(getQuery()).select('name').lean() : [],
      (assignType === 'all' || assignType === 'office_staff') ? OfficeStaff.find(getQuery()).select('name').lean() : [],
      (assignType === 'all' || assignType === 'field_executive') ? Executive.find(getQuery()).select('name').lean() : []
    ]);

    const allStaff = [
      ...tls.map(s => ({ ...s, type: 'team_leader' })),
      ...osse.map(s => ({ ...s, type: 'office_staff' })),
      ...execs.map(s => ({ ...s, type: 'field_executive' }))
    ];

    // For each staff, calculate achievement from DailyReports in target range
    const progressData = await Promise.all(allStaff.map(async (staff) => {
      const reports = await DailyReport.find({
        staff_id: staff._id,
        date: { $gte: target.start_date, $lte: target.end_date },
        status: 'admin_verified'
      }).lean();

      let achieved = 0;
      reports.forEach(r => {
        if (target.target_type === 'partner_onboarding') achieved += (r.partners_registered || 0);
        else if (target.target_type === 'calling') achieved += (r.calls_made || 0);
        else if (target.target_type === 'lead_generation') achieved += (r.leads_generated || r.leads_uploaded || 0);
        else if (target.target_type === 'sales') achieved += (r.subscriptions_sold || 0);
        else if (target.target_type === 'subscription') achieved += (r.subscriptions_sold || 0);
      });

      const incentive = target.incentive_type === 'fixed' 
        ? achieved * target.incentive_rate 
        : 0; // percentage would need business value, not available yet

      return {
        staff_id: staff._id,
        name: staff.name,
        staff_type: staff.type,
        achieved_value: achieved,
        incentive_earned: incentive
      };
    }));

    res.status(200).json({ success: true, data: progressData });
  } catch (err) {
    logger.error({ err }, 'getTargetProgress Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Admin: Staff Stats (for dashboard/sidebar badges) ──────────────────────

const getStaffStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [tlCount, feCount, osCount, todayAttendance, pendingLeaves, pendingReports] = await Promise.all([
      TeamLeader.countDocuments({ is_active: true, onboarding_status: 'approved' }),
      Executive.countDocuments({ is_active: true, onboarding_status: { $in: ['approved', 'verified'] } }),
      OfficeStaff.countDocuments({ is_active: true, onboarding_status: 'approved' }),
      StaffAttendance.countDocuments({ date: today, status: 'present' }),
      LeaveRequest.countDocuments({ status: { $in: ['pending', 'tl_approved'] } }),
      DailyReport.countDocuments({ status: 'submitted', date: today }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        team_leaders: tlCount,
        field_executives: feCount,
        office_staff: osCount,
        today_present: todayAttendance,
        pending_leaves: pendingLeaves,
        pending_reports: pendingReports,
      },
    });
  } catch (err) {
    logger.error({ err }, 'getStaffStats Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Admin: Leave Management ─────────────────────────────────────────────────

const getAllLeaves = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      const statuses = req.query.status.split(',').map((s) => s.trim()).filter(Boolean);
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }
    if (req.query.staff_type) filter.staff_type = req.query.staff_type;
    if (req.query.month) {
      const [year, month] = req.query.month.split('-');
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      filter.start_date = { $lte: `${year}-${month}-${String(lastDay).padStart(2, '0')}` };
      filter.end_date = { $gte: `${year}-${month}-01` };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, leaves] = await Promise.all([
      LeaveRequest.countDocuments(filter),
      LeaveRequest.find(filter)
        .populate('staff_id', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({ success: true, data: leaves, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, 'getAllLeaves Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const adminApproveLeave = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { action, note } = req.body;
    const newStatus = action === 'approve' ? 'admin_approved' : 'admin_rejected';

    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: newStatus,
        admin_note: note,
        admin_reviewed_at: new Date(),
        admin_reviewed_by: req.user.id,
      },
      { new: true, session }
    );
    if (!leave) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    if (action === 'approve') {
      await StaffAttendance.updateMany(
        {
          staff_id: leave.staff_id,
          date: { $gte: leave.start_date, $lte: leave.end_date },
        },
        { status: 'on_leave' },
        { session }
      );
    }

    await AuditLog.create([{
      admin_id: req.user.id,
      action: action === 'approve' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
      resource_id: leave._id,
      resource_type: 'LeaveRequest',
      details: { note },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    }], { session });

    await session.commitTransaction();

    // Invalidate the staff member's cached leaves so they see the updated status immediately
    await invalidate.staffLeaves(leave.staff_id);

    res.status(200).json({ success: true, message: `Leave ${action}d successfully.` });
  } catch (err) {
    await session.abortTransaction();
    logger.error({ err }, 'adminApproveLeave Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    session.endSession();
  }
};

// ─── Admin: Performance & Salary ─────────────────────────────────────────────

const getStaffPerformance = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const filter = { month };
    if (req.query.staff_type) filter.staff_type = req.query.staff_type;

    const performance = await StaffPerformance.find(filter)
      .populate('staff_id', 'name')
      .sort({ achievement_rate: -1 })
      .lean();
    res.status(200).json({ success: true, data: performance, month });
  } catch (err) {
    logger.error({ err }, 'getStaffPerformance Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const finalizeMonthPerformance = async (req, res) => {
  try {
    const month = req.body.month || new Date().toISOString().slice(0, 7);

    // Ensure missing records exist for all active staff (B-6)
    const allStaff = [
      ...(await TeamLeader.find({ is_active: true, onboarding_status: 'approved' }).select('_id').lean()).map(s => ({ ...s, type: 'team_leader' })),
      ...(await OfficeStaff.find({ is_active: true, onboarding_status: 'approved' }).select('_id').lean()).map(s => ({ ...s, type: 'office_staff' })),
      ...(await Executive.find({ is_active: true, onboarding_status: { $in: ['approved', 'verified'] } }).select('_id').lean()).map(s => ({ ...s, type: 'field_executive' })),
    ];
    await Promise.all(allStaff.map(s =>
      StaffPerformance.updateOne(
        { staff_id: s._id, month },
        { $setOnInsert: { staff_id: s._id, staff_type: s.type, month, target_value: 0, achieved_value: 0, achievement_rate: 0, status: 'pending' } },
        { upsert: true }
      )
    ));

    const performances = await StaffPerformance.find({ month, status: 'pending' });

    let processed = 0;
    for (const perf of performances) {
      perf.is_deficient = perf.achievement_rate < 0.70;

      if (perf.is_deficient) {
        const prevPerf = await StaffPerformance.findOne({
          staff_id: perf.staff_id,
          staff_type: perf.staff_type,
          month: { $lt: month },
          status: 'finalized',
        }).sort({ month: -1 }).lean();
        const prevConsecutive = (prevPerf?.is_deficient) ? (prevPerf.consecutive_deficient_months || 1) : 0;
        perf.consecutive_deficient_months = prevConsecutive + 1;

        if (perf.consecutive_deficient_months >= 2) {
          let baseRef;
          if (perf.staff_type === 'team_leader') {
            baseRef = await TeamLeader.findById(perf.staff_id).select('fixed_salary').lean();
            perf.salary_cut_amount = Math.round((baseRef?.fixed_salary || 0) * 0.10);
          } else if (perf.staff_type === 'office_staff') {
            baseRef = await OfficeStaff.findById(perf.staff_id).select('fixed_salary').lean();
            perf.salary_cut_amount = Math.round((baseRef?.fixed_salary || 0) * 0.10);
          } else {
            baseRef = await Executive.findById(perf.staff_id).select('salary').lean();
            perf.salary_cut_amount = Math.round((baseRef?.salary?.base || 0) * 0.10);
          }
          perf.salary_cut_applied = true;
        }
      } else {
        perf.consecutive_deficient_months = 0;
        perf.salary_cut_applied = false;
      }

      perf.status = 'finalized';
      perf.finalized_by = req.user.id;
      perf.finalized_at = new Date();
      await perf.save();
      processed++;
    }

    res.status(200).json({ success: true, message: `Finalized ${processed} performance records for ${month}.` });
  } catch (err) {
    logger.error({ err }, 'finalizeMonthPerformance Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getStaffSalaryRecords = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const filter = { month };
    if (req.query.staff_type === 'executive') filter.executive_id = { $exists: true, $ne: null };
    else if (req.query.staff_type) filter.staff_type = req.query.staff_type;

    const records = await SalaryRecord.find(filter)
      .populate('staff_id', 'name')
      .populate('executive_id', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: records, month });
  } catch (err) {
    logger.error({ err }, 'getStaffSalaryRecords Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const processMonthlyStaffSalary = async (req, res) => {
  try {
    const month = req.body.month || new Date().toISOString().slice(0, 7);

    const [teamLeaders, officeStaff] = await Promise.all([
      TeamLeader.find({ onboarding_status: 'approved', is_active: true }).lean(),
      OfficeStaff.find({ onboarding_status: 'approved', is_active: true }).lean(),
    ]);

    const tlPromises = teamLeaders.map(async (tl) => {
      // Check if already paid (B-7)
      const existingPaid = await SalaryRecord.findOne({ staff_id: tl._id, month, staff_type: 'team_leader', status: 'paid' }).lean();
      if (existingPaid) return 0;

      const perf = await StaffPerformance.findOne({ staff_id: tl._id, month, staff_type: 'team_leader' }).lean();
      const deduction = perf?.salary_cut_applied ? (perf.salary_cut_amount || 0) : 0;
      const commission = perf?.team_commission_earned || 0;
      const incentive = perf?.incentive_earned || 0;

      await SalaryRecord.updateOne(
        { staff_id: tl._id, month, staff_type: 'team_leader' },
        {
          $set: {
            base_salary: tl.fixed_salary,
            effective_salary: tl.fixed_salary - deduction + commission + incentive,
            team_commission_amount: commission,
            incentive_amount: incentive,
            deduction_applied: deduction > 0,
            deduction_amount: deduction,
          },
          $setOnInsert: {
            staff_id: tl._id,
            staff_type: 'team_leader',
            month,
            status: 'pending',
          },
        },
        { upsert: true }
      );
      return 1;
    });

    const osPromises = officeStaff.map(async (os) => {
      // Check if already paid (B-7)
      const existingPaid = await SalaryRecord.findOne({ staff_id: os._id, month, staff_type: 'office_staff', status: 'paid' }).lean();
      if (existingPaid) return 0;

      const perf = await StaffPerformance.findOne({ staff_id: os._id, month, staff_type: 'office_staff' }).lean();
      const deduction = perf?.salary_cut_applied ? (perf.salary_cut_amount || 0) : 0;
      const incentive = perf?.incentive_earned || 0;

      await SalaryRecord.updateOne(
        { staff_id: os._id, month, staff_type: 'office_staff' },
        {
          $set: {
            base_salary: os.fixed_salary,
            effective_salary: os.fixed_salary - deduction + incentive,
            incentive_amount: incentive,
            deduction_applied: deduction > 0,
            deduction_amount: deduction,
          },
          $setOnInsert: {
            staff_id: os._id,
            staff_type: 'office_staff',
            month,
            status: 'pending',
          },
        },
        { upsert: true }
      );
      return 1;
    });

    const results = await Promise.all([...tlPromises, ...osPromises]);
    const created = results.reduce((acc, curr) => acc + curr, 0);

    if (created > 0) {
      await AuditLog.create({
        admin_id: req.user.id,
        action: 'PROCESS_SALARY',
        resource_id: req.user.id, // Scoped to admin who triggered
        resource_type: 'SalaryRecord',
        details: { month, count: created },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    }

    res.status(200).json({ success: true, message: `Processed salary for ${created} staff members for ${month}.` });
  } catch (err) {
    logger.error({ err }, 'processMonthlyStaffSalary Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const markSalaryPaid = async (req, res) => {
  try {
    const { notes } = req.body;
    const record = await SalaryRecord.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paid_at: new Date(), paid_by: req.user.id, note: notes || '' },
      { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'Salary record not found.' });
    
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'MARK_SALARY_PAID',
      resource_id: record._id,
      resource_type: 'SalaryRecord',
      details: { notes },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(200).json({ success: true, message: 'Salary marked as paid.' });
  } catch (err) {
    logger.error({ err }, 'markSalaryPaid Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Admin: Leaderboard ──────────────────────────────────────────────────────

const getStaffLeaderboard = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const filter = { month, status: 'finalized' };
    if (req.query.staff_type) filter.staff_type = req.query.staff_type;

    const leaderboard = await StaffPerformance.find(filter)
      .populate('staff_id', 'name')
      .sort({ achievement_rate: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ success: true, data: leaderboard, month });
  } catch (err) {
    logger.error({ err }, 'getStaffLeaderboard Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Admin: Attendance ───────────────────────────────────────────────────────

const getAllAttendance = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const filter = { date };
    if (req.query.staff_type) filter.staff_type = req.query.staff_type;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, attendance] = await Promise.all([
      StaffAttendance.countDocuments(filter),
      StaffAttendance.find(filter)
        .populate('staff_id', 'name phone')
        .sort({ check_in_time: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    res.status(200).json({ success: true, data: attendance, total, page, totalPages: Math.ceil(total / limit), date });
  } catch (err) {
    logger.error({ err }, 'getAllAttendance Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const adminVerifyAttendance = async (req, res) => {
  try {
    const record = await StaffAttendance.findByIdAndUpdate(
      req.params.id,
      { verified_by_admin: true, admin_verified_at: new Date(), admin_verified_by: req.user.id },
      { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'VERIFY_ATTENDANCE',
      resource_id: record._id,
      resource_type: 'StaffAttendance',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(200).json({ success: true, message: 'Attendance verified.' });
  } catch (err) {
    logger.error({ err }, 'adminVerifyAttendance Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Admin: Daily Reports ────────────────────────────────────────────────────

const getAllDailyReports = async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) filter.date = req.query.date;
    if (req.query.staff_type) filter.staff_type = req.query.staff_type;
    if (req.query.status) filter.status = req.query.status;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [total, reports] = await Promise.all([
      DailyReport.countDocuments(filter),
      DailyReport.find(filter)
        .populate('staff_id', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    res.status(200).json({ success: true, data: reports, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, 'getAllDailyReports Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const adminVerifyDailyReport = async (req, res) => {
  try {
    const { action, remarks } = req.body;
    const newStatus = action === 'approve' ? 'admin_verified' : 'admin_rejected';
    const report = await DailyReport.findByIdAndUpdate(
      req.params.id,
      { status: newStatus, admin_remarks: remarks, admin_verified_at: new Date(), admin_verified_by: req.user.id },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    
    await invalidate.staffProfile(report.staff_id, report.staff_type);

    await AuditLog.create({
      admin_id: req.user.id,
      action: 'VERIFY_REPORT',
      resource_id: report._id,
      resource_type: 'DailyReport',
      details: { action, remarks },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(200).json({ success: true, message: `Report ${action}d.` });
  } catch (err) {
    logger.error({ err }, 'adminVerifyDailyReport Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const exportAttendanceToCSV = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const attendance = await StaffAttendance.find({ date })
      .populate('staff_id', 'name phone email')
      .sort({ check_in_time: 1 })
      .lean();

    if (!attendance.length) return res.status(404).json({ success: false, message: 'No records found for this date.' });

    const headers = ['Staff Name', 'Phone', 'Email', 'Role', 'Status', 'Check-in', 'Check-out', 'Distance (km)', 'Admin Verified'];
    const rows = attendance.map(a => [
      a.staff_id?.name || 'N/A',
      a.staff_id?.phone || 'N/A',
      a.staff_id?.email || 'N/A',
      a.staff_type,
      a.status,
      a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString() : '-',
      a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString() : '-',
      a.total_distance_km?.toFixed(2) || '0',
      a.verified_by_admin ? 'Yes' : 'No'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${date}.csv`);
    res.send(csvContent);
  } catch (err) {
    logger.error({ err }, 'exportAttendanceToCSV Error');
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
};

const exportReportsToCSV = async (req, res) => {
  try {
    const { start_date, end_date, staff_type } = req.query;
    const filter = {};
    if (start_date && end_date) filter.date = { $gte: start_date, $lte: end_date };
    if (staff_type) filter.staff_type = staff_type;

    const reports = await DailyReport.find(filter)
      .populate('staff_id', 'name phone')
      .sort({ date: -1 })
      .lean();

    if (!reports.length) return res.status(404).json({ success: false, message: 'No reports found.' });

    const headers = ['Date', 'Staff Name', 'Role', 'Status', 'Achievement (%)', 'Description', 'Admin Verified'];
    const rows = reports.map(r => [
      r.date,
      r.staff_id?.name || 'N/A',
      r.staff_type,
      r.status,
      r.achievement_rate ? (r.achievement_rate * 100).toFixed(0) : '0',
      r.description?.replace(/\n/g, ' ') || '',
      r.status === 'admin_verified' ? 'Yes' : 'No'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=reports-export.csv`);
    res.send(csvContent);
  } catch (err) {
    logger.error({ err }, 'exportReportsToCSV Error');
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
};


// ─── Admin: Executive Lead Transfer ─────────────────────────────────────────

/**
 * @desc    Transfer all onboarded partners from one executive to another.
 * @route   POST /api/admin/staff/executives/:id/transfer-leads
 * @body    { to_executive_id: string }
 */
const transferExecutiveLeads = async (req, res) => {
  try {
    const fromExecutiveId = req.params.id;
    const { to_executive_id } = req.body;

    if (!to_executive_id) {
      return res.status(400).json({ success: false, message: 'to_executive_id is required.' });
    }
    if (fromExecutiveId === to_executive_id) {
      return res.status(400).json({ success: false, message: 'Source and destination executive cannot be the same.' });
    }

    // Validate both executives exist
    const [fromExec, toExec] = await Promise.all([
      Executive.findById(fromExecutiveId),
      Executive.findById(to_executive_id)
    ]);

    if (!fromExec) return res.status(404).json({ success: false, message: 'Source executive not found.' });
    if (!toExec) return res.status(404).json({ success: false, message: 'Destination executive not found.' });
    if (!toExec.is_active) return res.status(400).json({ success: false, message: 'Destination executive is inactive.' });

    // Find all partners linked to the source executive (via referral code OR assigned_executive)
    const affectedPartners = await Partner.find({
      $or: [
        { referral_code_used: fromExec.referral_code },
        { assigned_executive: fromExec._id }
      ]
    }).select('_id name');

    const count = affectedPartners.length;
    if (count === 0) {
      return res.status(200).json({ success: true, message: 'No partners found for this executive.', transferred: 0 });
    }

    // Transfer: update assigned_executive to the new executive
    // Note: referral_code_used & referred_by_executive are preserved for historical accuracy
    await Partner.updateMany(
      { _id: { $in: affectedPartners.map(p => p._id) } },
      { $set: { assigned_executive: toExec._id } }
    );

    // Create Audit Log
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'TRANSFER_EXECUTIVE_LEADS',
      resource_id: fromExec._id,
      resource_type: 'Executive',
      details: {
        from_executive: fromExec.name,
        to_executive: toExec.name,
        partners_transferred: count
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    logger.info(`[LEAD TRANSFER] ${count} partners transferred from ${fromExec.name} to ${toExec.name} by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: `Successfully transferred ${count} partner(s) from ${fromExec.name} to ${toExec.name}.`,
      transferred: count,
      from_executive: { _id: fromExec._id, name: fromExec.name },
      to_executive: { _id: toExec._id, name: toExec.name }
    });
  } catch (err) {
    logger.error({ err }, 'transferExecutiveLeads Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  // Auth
  staffLogin,
  staffLogout,
  getStaffMe,
  changeStaffPassword,
  staffForgotPassword,
  staffResetPassword,
  // Team Leaders
  getAllTeamLeaders,
  getTeamLeaderById,
  createTeamLeader,
  updateTeamLeader,
  toggleTeamLeaderActive,
  approveTeamLeader,
  rejectTeamLeader,
  updateTeamLeaderSalary,
  getTeamLeaderTeam,
  // Office Staff
  getAllOfficeStaff,
  getOfficeStaffById,
  createOfficeStaff,
  updateOfficeStaff,
  toggleOfficeStaffActive,
  approveOfficeStaff,
  rejectOfficeStaff,
  reassignOfficeStaff,
  assignExecutiveToTL,
  // Executive Lead Transfer
  transferExecutiveLeads,
  // Targets
  getAllTargets,
  createTarget,
  updateTarget,
  toggleTargetStatus,
  deleteTarget,
  getTargetProgress,
  // Stats
  getStaffStats,
  // Leaves
  getAllLeaves,
  adminApproveLeave,
  // Performance & Salary
  getStaffPerformance,
  finalizeMonthPerformance,
  getStaffSalaryRecords,
  processMonthlyStaffSalary,
  markSalaryPaid,
  getStaffLeaderboard,
  // Attendance
  getAllAttendance,
  adminVerifyAttendance,
  // Reports
  getAllDailyReports,
  adminVerifyDailyReport,
  exportAttendanceToCSV,
  exportReportsToCSV,
};

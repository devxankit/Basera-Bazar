const logger = require('../../utils/logger');
const StaffAttendance = require('../../models/StaffAttendance');
const LeaveRequest = require('../../models/LeaveRequest');
const { calculateDistance } = require('../../utils/geoFence');
const { OfficeStaff } = require('../../models/Staff');
const Executive = require('../../models/Executive');

const GEO_FENCE_RADIUS_METERS = parseInt(process.env.GEO_FENCE_RADIUS_METERS || '500', 10);
const OFFICE_LAT = parseFloat(process.env.OFFICE_LAT || '28.6139');
const OFFICE_LNG = parseFloat(process.env.OFFICE_LNG || '77.2090');

// ─── Field Executive: GPS Check-in ──────────────────────────────────────────

const fieldExecutiveCheckIn = async (req, res) => {
  const { latitude, longitude, selfie_url } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    const existing = await StaffAttendance.findOne({ staff_id: req.user.id, date: today });
    if (existing && existing.check_in_time) {
      return res.status(400).json({ success: false, message: 'Already checked in for today.' });
    }

    const distanceM = calculateDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);
    const geoFenceValid = distanceM <= GEO_FENCE_RADIUS_METERS;

    const exec = await Executive.findById(req.user.id).select('team_leader_id').lean();

    await StaffAttendance.findOneAndUpdate(
      { staff_id: req.user.id, date: today },
      {
        staff_id: req.user.id,
        staff_type: 'field_executive',
        date: today,
        check_in_time: new Date(),
        check_in_location: { type: 'Point', coordinates: [longitude, latitude] },
        check_in_selfie: selfie_url,
        geo_fence_valid: geoFenceValid,
        geo_fence_distance_m: Math.round(distanceM),
        status: 'present',
        team_leader_id: exec?.team_leader_id || null,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: { geo_fence_valid: geoFenceValid, distance_m: Math.round(distanceM) },
      message: geoFenceValid ? 'Checked in successfully.' : `Checked in but you are ${Math.round(distanceM)}m outside the geo-fence.`,
    });
  } catch (err) {
    logger.error({ err }, 'fieldExecutiveCheckIn Error');
    res.status(500).json({ success: false, message: 'Server error during check-in.' });
  }
};

const fieldExecutiveCheckOut = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const record = await StaffAttendance.findOne({ staff_id: req.user.id, date: today });
    if (!record || !record.check_in_time) {
      return res.status(400).json({ success: false, message: 'No active check-in found for today.' });
    }
    if (record.check_out_time) {
      return res.status(400).json({ success: false, message: 'Already checked out for today.' });
    }

    const now = new Date();
    const hours = (now - record.check_in_time) / (1000 * 60 * 60);
    record.check_out_time = now;
    record.working_hours = parseFloat(hours.toFixed(2));
    if (hours < 4) record.status = 'half_day';
    await record.save();

    res.status(200).json({
      success: true,
      data: { working_hours: record.working_hours, status: record.status },
      message: 'Checked out successfully.',
    });
  } catch (err) {
    logger.error({ err }, 'fieldExecutiveCheckOut Error');
    res.status(500).json({ success: false, message: 'Server error during check-out.' });
  }
};

const getExecutiveAttendance = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, mon] = month.split('-');
    const start = `${year}-${mon}-01`;
    const lastDay = new Date(Number(year), Number(mon), 0).getDate();
    const end = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;

    const records = await StaffAttendance.find({
      staff_id: req.user.id,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 }).lean();

    res.status(200).json({ success: true, data: records, month });
  } catch (err) {
    logger.error({ err }, 'getExecutiveAttendance Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getExecutiveTodayAttendance = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const record = await StaffAttendance.findOne({ staff_id: req.user.id, date: today }).lean();
    res.status(200).json({ success: true, data: record || null, date: today });
  } catch (err) {
    logger.error({ err }, 'getExecutiveTodayAttendance Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Office Staff: System Login/Logout Attendance ───────────────────────────

const officeStaffCheckIn = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const existing = await StaffAttendance.findOne({ staff_id: req.user.id, date: today });
    if (existing && existing.check_in_time) {
      return res.status(400).json({ success: false, message: 'Already checked in for today.' });
    }

    const os = await OfficeStaff.findById(req.user.id).select('team_leader_id').lean();

    await StaffAttendance.findOneAndUpdate(
      { staff_id: req.user.id, date: today },
      {
        staff_id: req.user.id,
        staff_type: 'office_staff',
        date: today,
        check_in_time: req.body.check_in_time ? new Date(req.body.check_in_time) : new Date(),
        status: 'present',
        geo_fence_valid: true,
        team_leader_id: os?.team_leader_id || null,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'Checked in successfully.' });
  } catch (err) {
    logger.error({ err }, 'officeStaffCheckIn Error');
    res.status(500).json({ success: false, message: 'Server error during check-in.' });
  }
};

const officeStaffCheckOut = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const record = await StaffAttendance.findOne({ staff_id: req.user.id, date: today });
    if (!record || !record.check_in_time) {
      return res.status(400).json({ success: false, message: 'No active check-in found for today.' });
    }
    if (record.check_out_time) {
      return res.status(400).json({ success: false, message: 'Already checked out for today.' });
    }

    const now = new Date();
    const hours = (now - record.check_in_time) / (1000 * 60 * 60);
    record.check_out_time = now;
    record.working_hours = parseFloat(hours.toFixed(2));
    if (hours < 4) record.status = 'half_day';
    await record.save();

    res.status(200).json({
      success: true,
      data: { working_hours: record.working_hours },
      message: 'Checked out successfully.',
    });
  } catch (err) {
    logger.error({ err }, 'officeStaffCheckOut Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOfficeStaffAttendance = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, mon] = month.split('-');
    const start = `${year}-${mon}-01`;
    const lastDay = new Date(Number(year), Number(mon), 0).getDate();
    const end = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;

    const records = await StaffAttendance.find({
      staff_id: req.user.id,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 }).lean();

    res.status(200).json({ success: true, data: records, month });
  } catch (err) {
    logger.error({ err }, 'getOfficeStaffAttendance Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Team Leader: Verify Team Attendance ────────────────────────────────────

const tlVerifyAttendance = async (req, res) => {
  try {
    const record = await StaffAttendance.findOne({
      _id: req.params.id,
      team_leader_id: req.user.id,
    });
    if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found or not in your team.' });

    record.verified_by_team_leader = true;
    record.team_leader_verified_at = new Date();
    await record.save();

    res.status(200).json({ success: true, message: 'Attendance verified.' });
  } catch (err) {
    logger.error({ err }, 'tlVerifyAttendance Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const tlGetTeamAttendance = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const attendance = await StaffAttendance.find({ team_leader_id: req.user.id, date }).sort({ check_in_time: 1 }).lean();
    res.status(200).json({ success: true, data: attendance, date });
  } catch (err) {
    logger.error({ err }, 'tlGetTeamAttendance Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Leave Requests ──────────────────────────────────────────────────────────

const submitLeaveRequest = async (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  try {
    const startD = new Date(start_date);
    const endD = new Date(end_date);
    const total_days = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24)) + 1;

    const staff_type = req.user.role === 'team_leader'
      ? 'team_leader'
      : req.user.role === 'office_staff'
      ? 'office_staff'
      : 'field_executive';

    let team_leader_id = null;
    if (staff_type === 'office_staff') {
      const os = await OfficeStaff.findById(req.user.id).select('team_leader_id').lean();
      team_leader_id = os?.team_leader_id || null;
    } else if (staff_type === 'field_executive') {
      const exec = await Executive.findById(req.user.id).select('team_leader_id').lean();
      team_leader_id = exec?.team_leader_id || null;
    }

    // Overlap check (B-5)
    const overlap = await LeaveRequest.findOne({
      staff_id: req.user.id,
      status: { $in: ['pending', 'tl_approved', 'admin_approved'] },
      start_date: { $lte: end_date },
      end_date: { $gte: start_date },
    });
    if (overlap) {
      return res.status(409).json({ success: false, message: 'You already have a leave request covering these dates.' });
    }

    const leave = await LeaveRequest.create({
      staff_id: req.user.id,
      staff_type,
      team_leader_id,
      leave_type,
      start_date,
      end_date,
      total_days,
      reason,
    });

    res.status(201).json({ success: true, data: leave, message: 'Leave request submitted.' });
  } catch (err) {
    logger.error({ err }, 'submitLeaveRequest Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ staff_id: req.user.id }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: leaves });
  } catch (err) {
    logger.error({ err }, 'getMyLeaves Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const tlApproveLeave = async (req, res) => {
  try {
    const { action, note } = req.body;
    const newStatus = action === 'approve' ? 'tl_approved' : 'tl_rejected';
    const leave = await LeaveRequest.findOneAndUpdate(
      { _id: req.params.id, team_leader_id: req.user.id, status: 'pending' },
      { status: newStatus, tl_note: note, tl_reviewed_at: new Date() },
      { new: true }
    );
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found or already reviewed.' });
    res.status(200).json({ success: true, message: `Leave ${action}d.` });
  } catch (err) {
    logger.error({ err }, 'tlApproveLeave Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const tlGetTeamLeaves = async (req, res) => {
  try {
    const filter = { team_leader_id: req.user.id };
    if (req.query.status) filter.status = req.query.status;
    const leaves = await LeaveRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: leaves });
  } catch (err) {
    logger.error({ err }, 'tlGetTeamLeaves Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  fieldExecutiveCheckIn,
  fieldExecutiveCheckOut,
  getExecutiveAttendance,
  getExecutiveTodayAttendance,
  officeStaffCheckIn,
  officeStaffCheckOut,
  getOfficeStaffAttendance,
  tlVerifyAttendance,
  tlGetTeamAttendance,
  submitLeaveRequest,
  getMyLeaves,
  tlApproveLeave,
  tlGetTeamLeaves,
};

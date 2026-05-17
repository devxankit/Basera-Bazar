const logger = require('../../utils/logger');
const { OfficeStaff } = require('../../models/Staff');
const SalaryRecord = require('../../models/SalaryRecord');
const StaffTarget = require('../../models/StaffTarget');
const StaffPerformance = require('../../models/StaffPerformance');
const DailyReport = require('../../models/DailyReport');
const StaffAttendance = require('../../models/StaffAttendance');

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

module.exports = {
  getOSDashboard,
  getOSTargets,
  submitOSDailyReport,
  getOSReports,
  getOSSalary,
  getOSProfile,
  updateOSProfile,
};

const logger = require('../../utils/logger');
const Executive = require('../../models/Executive');
const DailyReport = require('../../models/DailyReport');
const StaffTarget = require('../../models/StaffTarget');
const invalidate = require('../../utils/cacheInvalidator');

const submitExecutiveDailyReport = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const exec = await Executive.findById(req.user.id).select('team_leader_id').lean();

    const existing = await DailyReport.findOne({ staff_id: req.user.id, date: today });
    if (existing && existing.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Daily report already submitted for today.' });
    }

    const report = await DailyReport.findOneAndUpdate(
      { staff_id: req.user.id, date: today },
      {
        staff_id: req.user.id,
        staff_type: 'field_executive',
        team_leader_id: exec?.team_leader_id || null,
        date: today,
        ...req.body,
        status: 'submitted',
      },
      { upsert: true, new: true }
    );

    await invalidate.executiveProfile(req.user.id);

    res.status(200).json({ success: true, data: report, message: 'Daily report submitted.' });
  } catch (err) {
    logger.error({ err }, 'submitExecutiveDailyReport Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getExecutiveDailyReports = async (req, res) => {
  try {
    const filter = { staff_id: req.user.id };
    if (req.query.month) {
      const [year, mon] = req.query.month.split('-');
      filter.date = { $gte: `${year}-${mon}-01`, $lte: `${year}-${mon}-31` };
    }
    const reports = await DailyReport.find(filter).sort({ date: -1 }).lean();
    res.status(200).json({ success: true, data: reports });
  } catch (err) {
    logger.error({ err }, 'getExecutiveDailyReports Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getExecutiveTargets = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const targets = await StaffTarget.find({
      is_active: true,
      end_date: { $gte: today },
      $or: [
        { assign_to_type: 'all' },
        { assign_to_type: 'field_executive' },
        { assign_to_type: 'field_executive', assign_to_ids: req.user.id },
      ],
    }).lean();
    res.status(200).json({ success: true, data: targets });
  } catch (err) {
    logger.error({ err }, 'getExecutiveTargets Error');
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  submitExecutiveDailyReport,
  getExecutiveDailyReports,
  getExecutiveTargets,
};

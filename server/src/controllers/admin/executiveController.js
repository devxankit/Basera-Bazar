const { Partner } = require('../../models/Partner');
const logger = require('../../utils/logger');
const { AppConfig } = require('../../models/System');
const { logActivity } = require('../../utils/activityLogger');
const Executive = require('../../models/Executive');
const WithdrawalRequest = require('../../models/Wallet');
const { createNotification } = require('../../utils/notificationHelper');
const invalidate = require('../../utils/cacheInvalidator');
const DailyTask = require('../../models/DailyTask');
const SalaryRecord = require('../../models/SalaryRecord');
const StaffAttendance = require('../../models/StaffAttendance');

const getAllExecutives = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const total = await Executive.countDocuments();
    const executives = await Executive.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const enrichedExecutives = await Promise.all(executives.map(async (exec) => {
      const onboardedCount = exec.referral_code
        ? await Partner.countDocuments({ referral_code_used: exec.referral_code })
        : 0;
      return { ...exec, onboardedCount };
    }));

    res.status(200).json({ success: true, data: enrichedExecutives, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error({ err: error }, 'getAllExecutives Error:')
    res.status(500).json({ success: false, message: 'Server error fetching executives.' });
  }
};

const getExecutiveDetail = async (req, res) => {
  try {
    const executive = await Executive.findById(req.params.id).lean();
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found' });

    const [partners, attendance] = await Promise.all([
      Partner.find({ referral_code_used: executive.referral_code })
        .select('name business_name phone onboarding_status createdAt')
        .sort({ createdAt: -1 }),
      StaffAttendance.find({ staff_id: executive._id })
        .sort({ date: -1 })
        .limit(30)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: { ...executive, partners, attendance, onboardedCount: partners.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateExecutiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    const executive = await Executive.findById(id);
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found' });

    executive.onboarding_status = status === 'approved' ? 'verified' : status;
    if (status === 'approved') {
      executive.is_active = true;
      executive.approved_at = new Date();
    } else if (status === 'rejected') {
      executive.kyc.rejection_reason = rejection_reason;
      executive.is_active = false;
    }

    await executive.save();

    await createNotification(
      'executive',
      executive._id,
      status === 'approved' ? 'Account Verified! 🎉' : 'KYC Rejected',
      status === 'approved'
        ? 'Congratulations! Your account has been verified. You can now start onboarding partners.'
        : `Your KYC documents were rejected. Reason: ${rejection_reason}`,
      { type: 'executive_verification', status }
    );

    await invalidate.executiveProfile(id);
    await invalidate.adminDashboard();

    res.status(200).json({ success: true, message: `Executive ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleExecutiveActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const executive = await Executive.findById(id);
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found' });

    const newStatus = !executive.is_active;
    executive.is_active = newStatus;

    if (!newStatus) {
      executive.deactivated_at = new Date();
      executive.deactivation_reason = reason || 'Deactivated by Admin';
      executive.token_version = (executive.token_version || 0) + 1;
    } else {
      executive.deactivated_at = null;
      executive.deactivation_reason = null;
    }

    await executive.save();

    res.status(200).json({
      success: true,
      message: `Executive ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { is_active: newStatus }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExecutive = async (req, res) => {
  try {
    const { id } = req.params;
    const executive = await Executive.findById(id);
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found' });

    if (executive.referral_code) {
      await Partner.updateMany(
        { referral_code_used: executive.referral_code },
        { $set: { referral_code_used: null, referred_by_executive: null } }
      );
    }

    await Executive.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Executive removed from database' });
  } catch (error) {
    logger.error({ err: error }, 'deleteExecutive Error:')
    res.status(500).json({ success: false, message: 'Server error deleting executive.' });
  }
};

const getWithdrawalRequests = async (req, res) => {
  try {
    const { user_type } = req.query;
    const query = user_type ? { user_type } : {};
    const requests = await WithdrawalRequest.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    logger.error({ err: error }, 'getWithdrawalRequests Error:');
    res.status(500).json({ success: false, message: 'Server error fetching withdrawal requests.' });
  }
};

const updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note, transaction_id } = req.body;

    const ALLOWED_STATUSES = ['approved', 'rejected', 'completed'];
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const request = await WithdrawalRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status !== 'pending' && request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a withdrawal that is already '${request.status}'.`
      });
    }

    const validTransitions = {
      pending: ['approved', 'rejected', 'completed'],
      approved: ['completed', 'rejected']
    };
    if (!validTransitions[request.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${request.status}' to '${status}'.`
      });
    }

    request.status = status;
    if (admin_note) request.admin_note = admin_note;
    if (transaction_id) request.transaction_id = transaction_id;
    if (status === 'completed') request.processed_at = new Date();

    await request.save();

    await logActivity({
      actor_name: req.user.name,
      actor_id: req.user.id,
      action: status === 'completed' ? 'settled' : status,
      entity_type: 'withdrawal',
      entity_name: request.bank_details?.account_holder_name || 'Unknown',
      entity_id: request._id,
      description: `Admin ${req.user.name} marked withdrawal as '${status}' for ${request.bank_details?.account_holder_name || 'Unknown'}`
    });

    if (status === 'rejected') {
      if (request.user_type === 'Executive') {
        await Executive.findByIdAndUpdate(request.user_id, { $inc: { wallet_balance: request.amount } });
      } else if (request.user_type === 'Partner') {
        await Partner.findByIdAndUpdate(request.user_id || request.partner_id, {
          $inc: { 'wallet.withdrawable_balance': request.amount }
        });
      }
    }

    res.status(200).json({ success: true, message: `Withdrawal request marked as '${status}' successfully` });
  } catch (error) {
    logger.error({ err: error }, 'updateWithdrawalStatus Error:')
    res.status(500).json({ success: false, message: 'Server error updating withdrawal status.' });
  }
};

const resetExecutiveKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const executive = await Executive.findById(id);
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found' });

    executive.kyc = {
      live_photo: null,
      aadhar_number: null,
      aadhar_image: null,
      pan_number: null,
      pan_image: null,
      rejection_reason: null
    };
    executive.onboarding_status = 'incomplete';
    executive.is_active = false;

    await executive.save();

    await logActivity({
      actor_name: req.user.name,
      actor_id: req.user.id,
      action: 'kyc_reset',
      entity_type: 'executive',
      entity_name: executive.name,
      entity_id: executive._id,
      description: `Admin ${req.user.name} reset KYC for executive ${executive.name}`
    });

    res.status(200).json({ success: true, message: 'Executive KYC reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExecutiveSettings = async (req, res) => {
  try {
    const commissionAmount = await AppConfig.findOne({ key: 'executive_commission_amount' });
    res.status(200).json({
      success: true,
      data: { commission_amount: commissionAmount ? commissionAmount.value : 100 }
    });
  } catch (error) {
    logger.error({ err: error }, 'Get executive settings error:')
    res.status(500).json({ success: false, message: 'Error fetching Executive settings.' });
  }
};

const updateExecutiveSettings = async (req, res) => {
  try {
    const { commission_amount } = req.body;

    if (commission_amount !== undefined) {
      await AppConfig.findOneAndUpdate(
        { key: 'executive_commission_amount' },
        {
          value: Number(commission_amount),
          description: 'Amount credited to Executive wallet per verified partner referral'
        },
        { upsert: true, new: true }
      );
    }

    await logActivity({
      actor_name: req.user.name,
      actor_id: req.user.id,
      action: 'settings_updated',
      entity_type: 'system',
      entity_name: 'Executive Commission',
      description: `Updated executive commission to ₹${commission_amount}`
    });

    res.status(200).json({ success: true, message: 'Executive settings updated successfully!' });
  } catch (error) {
    logger.error({ err: error }, 'Update executive settings error:')
    res.status(500).json({ success: false, message: 'Error updating Executive settings.' });
  }
};

const validateReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Referral code is required.' });
    }

    const executive = await Executive.findOne({
      referral_code: code.toUpperCase(),
      onboarding_status: { $in: ['approved', 'verified'] },
      is_active: true
    });

    if (!executive) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive referral code.' });
    }

    res.status(200).json({ success: true, message: 'Code validated!', data: { name: executive.name } });
  } catch (error) {
    logger.error({ err: error }, 'Validate referral error:')
    res.status(500).json({ success: false, message: 'Error validating referral code.' });
  }
};

// 1. createDailyTask
const createDailyTask = async (req, res) => {
  try {
    const { target_count, description, date } = req.body;
    if (!target_count || target_count < 1) {
      return res.status(400).json({ success: false, message: 'Target count must be at least 1.' });
    }

    const now = new Date();
    const todayStr = date || new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];

    const task = await DailyTask.findOneAndUpdate(
      { date: todayStr },
      {
        date: todayStr,
        target_count,
        description: description || '',
        created_by: req.user.id
      },
      { upsert: true, new: true }
    );

    const executives = await Executive.find({ is_active: true });
    for (const exec of executives) {
      await createNotification(
        'executive',
        exec._id,
        'New Daily Task Set 📋',
        `Today's Target: Onboard ${target_count} partners. ${description || ''}`,
        { type: 'daily_task', date: todayStr }
      ).catch(err => logger.error({ err }, 'Notification failed for daily task'));
    }

    await logActivity({
      actor_name: req.user.name,
      actor_id: req.user.id,
      action: 'created',
      entity_type: 'executive',
      entity_name: `Daily Task ${todayStr}`,
      description: `Admin set daily task target to ${target_count} for date ${todayStr}`
    });

    res.status(200).json({ success: true, message: 'Daily task set successfully and executives notified.', data: task });
  } catch (error) {
    logger.error({ err: error }, 'createDailyTask Error:');
    res.status(500).json({ success: false, message: 'Server error setting daily task.' });
  }
};

// 2. getDailyTaskHistory
const getDailyTaskHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const total = await DailyTask.countDocuments();
    const tasks = await DailyTask.find().sort({ date: -1 }).skip(skip).limit(limit).lean();

    const activeExecsCount = await Executive.countDocuments({ is_active: true });
    const executives = await Executive.find({ is_active: true }, 'referral_code').lean();

    const enrichedTasks = await Promise.all(tasks.map(async (task) => {
      const dayStart = new Date(`${task.date}T00:00:00.000Z`);
      const dayEnd = new Date(`${task.date}T23:59:59.999Z`);
      
      let metCount = 0;
      for (const exec of executives) {
        if (!exec.referral_code) continue;
        const count = await Partner.countDocuments({
          referral_code_used: exec.referral_code,
          createdAt: { $gte: dayStart, $lte: dayEnd }
        });
        if (count / task.target_count >= 0.5) {
          metCount++;
        }
      }

      return {
        ...task,
        executives_met: metCount,
        total_executives: activeExecsCount
      };
    }));

    res.status(200).json({ success: true, data: enrichedTasks, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error({ err: error }, 'getDailyTaskHistory Error:');
    res.status(500).json({ success: false, message: 'Server error fetching task history.' });
  }
};

// 3. getTodayTaskProgress
const getTodayTaskProgress = async (req, res) => {
  try {
    const { date } = req.query;
    const now = new Date();
    const targetDateStr = date || new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];

    const task = await DailyTask.findOne({ date: targetDateStr }).lean();
    const executives = await Executive.find({ is_active: true }).lean();

    const dayStart = new Date(`${targetDateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${targetDateStr}T23:59:59.999Z`);

    const progressList = await Promise.all(executives.map(async (exec) => {
      const completed = exec.referral_code ? await Partner.countDocuments({
        referral_code_used: exec.referral_code,
        createdAt: { $gte: dayStart, $lte: dayEnd }
      }) : 0;

      const target = task ? task.target_count : 0;
      const percentage = target > 0 ? Math.round((completed / target) * 100) : 0;

      let status = 'no_task';
      if (task) {
        if (percentage >= 50) status = 'on_track';
        else if (percentage >= 25) status = 'in_progress';
        else status = 'at_risk';
      }

      return {
        executive_id: exec._id,
        name: exec.name,
        phone: exec.phone,
        completed,
        target,
        percentage,
        status,
        salary_effective: exec.salary?.effective || exec.salary?.base || 0
      };
    }));

    res.status(200).json({ success: true, task, data: progressList });
  } catch (error) {
    logger.error({ err: error }, 'getTodayTaskProgress Error:');
    res.status(500).json({ success: false, message: 'Server error fetching today task progress.' });
  }
};

// 4. setExecutiveSalary
const setExecutiveSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { base, effective } = req.body;
    const baseNum = Number(base);
    const effectiveNum = Number(effective);

    if (isNaN(baseNum) || baseNum < 0) {
      return res.status(400).json({ success: false, message: 'Valid base salary is required.' });
    }

    const executive = await Executive.findById(id);
    if (!executive) return res.status(404).json({ success: false, message: 'Executive not found.' });

    executive.salary = {
      ...executive.salary,
      base: baseNum,
      effective: isNaN(effectiveNum) ? baseNum : effectiveNum
    };

    await executive.save();

    await logActivity({
      actor_name: req.user.name,
      actor_id: req.user.id,
      action: 'updated',
      entity_type: 'executive',
      entity_name: executive.name,
      entity_id: executive._id,
      description: `Admin set base salary to ₹${baseNum} for executive ${executive.name}`
    });

    res.status(200).json({ success: true, message: 'Executive salary configured successfully.', data: executive.salary });
  } catch (error) {
    logger.error({ err: error }, 'setExecutiveSalary Error:');
    res.status(500).json({ success: false, message: 'Server error setting executive salary.' });
  }
};

// 5. getMonthlyPerformance
const getMonthlyPerformance = async (req, res) => {
  try {
    const { month } = req.query;
    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const records = await SalaryRecord.find({ month: targetMonth })
      .populate('executive_id', 'name phone email referral_code')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, month: targetMonth, data: records });
  } catch (error) {
    logger.error({ err: error }, 'getMonthlyPerformance Error:');
    res.status(500).json({ success: false, message: 'Server error fetching monthly performance.' });
  }
};

// 6. getSalaryRecords
const getSalaryRecords = async (req, res) => {
  try {
    const { executive_id, month } = req.query;
    const query = {};
    if (executive_id) query.executive_id = executive_id;
    if (month) query.month = month;

    const records = await SalaryRecord.find(query)
      .populate('executive_id', 'name phone')
      .populate('paid_by', 'name')
      .sort({ month: -1, createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    logger.error({ err: error }, 'getSalaryRecords Error:');
    res.status(500).json({ success: false, message: 'Server error fetching salary records.' });
  }
};

// 7. markSalaryPaid
const markSalaryPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const record = await SalaryRecord.findById(id).populate('executive_id', 'name');
    if (!record) return res.status(404).json({ success: false, message: 'Salary record not found.' });

    if (record.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Salary is already marked as paid.' });
    }

    record.status = 'paid';
    record.paid_at = new Date();
    record.paid_by = req.user.id;
    if (note) record.note = note;

    await record.save();

    await logActivity({
      actor_name: req.user.name,
      actor_id: req.user.id,
      action: 'paid',
      entity_type: 'executive',
      entity_name: record.executive_id?.name || 'Executive',
      entity_id: record.executive_id?._id,
      description: `Admin marked salary of ₹${record.effective_salary} as PAID for month ${record.month}`
    });

    res.status(200).json({ success: true, message: 'Salary marked as paid successfully.', data: record });
  } catch (error) {
    logger.error({ err: error }, 'markSalaryPaid Error:');
    res.status(500).json({ success: false, message: 'Server error marking salary paid.' });
  }
};

// 8. triggerMonthlyDeduction
const triggerMonthlyDeduction = async (req, res) => {
  try {
    const { month } = req.body;
    const { runMonthlyDeductionJob } = require('../../jobs/monthlyDeductionJob');

    await runMonthlyDeductionJob(month);

    res.status(200).json({ success: true, message: `Monthly deduction check triggered successfully for ${month || 'previous month'}.` });
  } catch (error) {
    logger.error({ err: error }, 'triggerMonthlyDeduction Error:');
    res.status(500).json({ success: false, message: 'Server error triggering monthly deduction.' });
  }
};

module.exports = {
  getAllExecutives,
  getExecutiveDetail,
  updateExecutiveStatus,
  toggleExecutiveActiveStatus,
  deleteExecutive,
  getWithdrawalRequests,
  updateWithdrawalStatus,
  resetExecutiveKyc,
  getExecutiveSettings,
  updateExecutiveSettings,
  validateReferralCode,
  createDailyTask,
  getDailyTaskHistory,
  getTodayTaskProgress,
  setExecutiveSalary,
  getMonthlyPerformance,
  getSalaryRecords,
  markSalaryPaid,
  triggerMonthlyDeduction
};

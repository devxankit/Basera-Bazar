const Executive = require('../models/Executive');
const DailyTask = require('../models/DailyTask');
const SalaryRecord = require('../models/SalaryRecord');
const { Partner } = require('../models/Partner');
const { logActivity } = require('../utils/activityLogger');
const logger = require('../utils/logger');

let _jobRunning = false;

const runMonthlyDeductionJob = async (targetMonthStr = null) => {
  if (_jobRunning) {
    logger.warn('[SCHEDULER] Monthly deduction job already running — skipping concurrent execution.');
    return;
  }
  _jobRunning = true;
  logger.info('[SCHEDULER] Running monthly salary deduction check...');
  try {
  const now = new Date();
  
  // Find previous month string YYYY-MM if targetMonthStr not provided
  let monthStr = targetMonthStr;
  if (!monthStr) {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    monthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  }
  
  const tasks = await DailyTask.find({
    date: { $gte: `${monthStr}-01`, $lte: `${monthStr}-31` }
  });
  
  if (!tasks.length) {
    logger.info(`[SCHEDULER] No tasks found for ${monthStr} — skipping deduction check.`);
    return;
  }
  
  const executives = await Executive.find({ is_active: true });
  
  for (const exec of executives) {
    try {
      // Skip if this month is already processed for this executive
      if (!targetMonthStr && exec.salary?.last_processed_month === monthStr) {
        continue;
      }
      
      let daysMet = 0;
      
      for (const task of tasks) {
        // Find partners onboarded by this executive on this task.date
        const dayStart = new Date(`${task.date}T00:00:00.000Z`);
        const dayEnd = new Date(`${task.date}T23:59:59.999Z`);
        
        const count = await Partner.countDocuments({
          referral_code_used: exec.referral_code,
          createdAt: { $gte: dayStart, $lte: dayEnd }
        });
        
        const pct = task.target_count > 0 ? count / task.target_count : 0;
        if (pct >= 0.5) {
          daysMet++;
        }
      }
      
      const completionRate = tasks.length > 0 ? daysMet / tasks.length : 0;
      const currentEffective = exec.salary?.effective || exec.salary?.base || 0;
      
      // Target is at least 50% average completion
      const deductionApplied = completionRate < 0.5;
      const deductionAmount = deductionApplied ? Math.round(currentEffective * 0.1) : 0;
      const newEffective = currentEffective - deductionAmount;
      
      // Upsert SalaryRecord
      await SalaryRecord.findOneAndUpdate(
        { executive_id: exec._id, month: monthStr },
        {
          executive_id: exec._id,
          month: monthStr,
          base_salary: exec.salary?.base || 0,
          effective_salary: newEffective,
          tasks_total: tasks.length,
          tasks_met: daysMet,
          completion_rate: completionRate,
          deduction_applied: deductionApplied,
          deduction_amount: deductionAmount,
          status: 'pending'
        },
        { upsert: true, new: true }
      );
      
      // Update Executive record
      await Executive.findByIdAndUpdate(exec._id, {
        'salary.effective': newEffective,
        'salary.last_processed_month': monthStr
      });
      
      if (deductionApplied) {
        logger.info(`[SCHEDULER] Deducted ₹${deductionAmount} from ${exec.name} for ${monthStr} due to low completion rate (${(completionRate * 100).toFixed(1)}%)`);
      }
      
      await logActivity({
        actor_name: 'System',
        action: 'updated',
        entity_type: 'executive',
        entity_name: exec.name,
        entity_id: exec._id,
        description: `Monthly processing ${monthStr}: ${(completionRate * 100).toFixed(1)}% completion. Deduction: ₹${deductionAmount}`
      });
      
    } catch (err) {
      logger.error({ err }, `[SCHEDULER] Failed processing exec ${exec._id}`);
    }
  }
    logger.info(`[SCHEDULER] Completed monthly processing for ${monthStr}.`);
  } catch (err) {
    logger.error({ err }, '[SCHEDULER] Monthly deduction job failed unexpectedly');
  } finally {
    _jobRunning = false;
  }
};

const scheduleMonthlyDeduction = () => {
  // Run check immediately on startup after a delay to let DB connections settle
  setTimeout(() => {
    runMonthlyDeductionJob().catch(err => logger.error({ err }, 'Error in runMonthlyDeductionJob startup'));
  }, 10000);
  
  // Run periodically every 6 hours
  setInterval(() => {
    const now = new Date();
    // Only run if it's the 1st, 2nd, or 3rd day of the month to ensure robust execution
    if (now.getDate() <= 3) {
      runMonthlyDeductionJob().catch(err => logger.error({ err }, 'Error in runMonthlyDeductionJob interval'));
    }
  }, 6 * 60 * 60 * 1000);
};

module.exports = { scheduleMonthlyDeduction, runMonthlyDeductionJob };

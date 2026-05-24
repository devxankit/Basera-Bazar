const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
let retryCount = 0;

const cleanOrphanedRecords = async () => {
  try {
    logger.info('[Cleanup] Starting check for orphaned staff records...');
    const Executive = require('../models/Executive');
    const { TeamLeader, OfficeStaff } = require('../models/Staff');
    const StaffAttendance = require('../models/StaffAttendance');
    const LeaveRequest = require('../models/LeaveRequest');
    const DailyReport = require('../models/DailyReport');
    const SalaryRecord = require('../models/SalaryRecord');
    const StaffPerformance = require('../models/StaffPerformance');
    const WithdrawalRequest = require('../models/Wallet');
    const { Transaction } = require('../models/Finance');
    const StaffTarget = require('../models/StaffTarget');
    const { Partner } = require('../models/Partner');

    const [execs, tls, osse] = await Promise.all([
      Executive.find().select('_id').lean(),
      TeamLeader.find().select('_id').lean(),
      OfficeStaff.find().select('_id').lean(),
    ]);

    const activeStaffIds = new Set([
      ...execs.map(e => e._id.toString()),
      ...tls.map(t => t._id.toString()),
      ...osse.map(o => o._id.toString()),
    ]);

    const deleteOrphans = async (Model, modelName, staffIdField = 'staff_id') => {
      const records = await Model.find().select(`_id ${staffIdField}`).lean();
      const orphanedIds = [];
      for (const rec of records) {
        const staffId = rec[staffIdField]?.toString();
        if (staffId && !activeStaffIds.has(staffId)) {
          orphanedIds.push(rec._id);
        }
      }
      if (orphanedIds.length > 0) {
        await Model.deleteMany({ _id: { $in: orphanedIds } });
        logger.info(`[Cleanup] Deleted ${orphanedIds.length} orphaned records from ${modelName}`);
      }
    };

    await deleteOrphans(StaffAttendance, 'StaffAttendance');
    await deleteOrphans(LeaveRequest, 'LeaveRequest');
    await deleteOrphans(DailyReport, 'DailyReport');
    await deleteOrphans(StaffPerformance, 'StaffPerformance');

    const salaryRecords = await SalaryRecord.find().select('_id staff_id executive_id').lean();
    const orphanedSalaries = [];
    for (const rec of salaryRecords) {
      const staffId = rec.staff_id?.toString();
      const execId = rec.executive_id?.toString();
      if ((staffId && !activeStaffIds.has(staffId)) || (execId && !activeStaffIds.has(execId))) {
        orphanedSalaries.push(rec._id);
      }
    }
    if (orphanedSalaries.length > 0) {
      await SalaryRecord.deleteMany({ _id: { $in: orphanedSalaries } });
      logger.info(`[Cleanup] Deleted ${orphanedSalaries.length} orphaned records from SalaryRecord`);
    }

    const withdrawals = await WithdrawalRequest.find({ user_type: 'Executive' }).select('_id user_id').lean();
    const orphanedWithdrawals = [];
    for (const rec of withdrawals) {
      const userId = rec.user_id?.toString();
      if (userId && !activeStaffIds.has(userId)) {
        orphanedWithdrawals.push(rec._id);
      }
    }
    if (orphanedWithdrawals.length > 0) {
      await WithdrawalRequest.deleteMany({ _id: { $in: orphanedWithdrawals } });
      logger.info(`[Cleanup] Deleted ${orphanedWithdrawals.length} orphaned records from WithdrawalRequest`);
    }

    const txs = await Transaction.find().select('_id executive_id').lean();
    const orphanedTxs = [];
    for (const rec of txs) {
      const execId = rec.executive_id?.toString();
      if (execId && !activeStaffIds.has(execId)) {
        orphanedTxs.push(rec._id);
      }
    }
    if (orphanedTxs.length > 0) {
      await Transaction.deleteMany({ _id: { $in: orphanedTxs } });
      logger.info(`[Cleanup] Deleted ${orphanedTxs.length} orphaned records from Transaction`);
    }

    const targets = await StaffTarget.find().select('_id assign_to_ids').lean();
    for (const target of targets) {
      const invalidIds = (target.assign_to_ids || []).filter(id => !activeStaffIds.has(id.toString()));
      if (invalidIds.length > 0) {
        await StaffTarget.updateOne(
          { _id: target._id },
          { $pull: { assign_to_ids: { $in: invalidIds } } }
        );
      }
    }

    const partners = await Partner.find({ assigned_executive: { $ne: null } }).select('_id assigned_executive').lean();
    const partnersToUnset = [];
    for (const p of partners) {
      if (p.assigned_executive && !activeStaffIds.has(p.assigned_executive.toString())) {
        partnersToUnset.push(p._id);
      }
    }
    if (partnersToUnset.length > 0) {
      await Partner.updateMany(
        { _id: { $in: partnersToUnset } },
        { $set: { assigned_executive: null } }
      );
      logger.info(`[Cleanup] Unset assigned_executive on ${partnersToUnset.length} Partners`);
    }

    logger.info('[Cleanup] Orphaned staff records check completed.');
  } catch (err) {
    logger.error({ err }, '[Cleanup] Failed to clean up orphaned staff records');
  }
};

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    logger.fatal('MONGO_URI environment variable is not set. Exiting.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    retryCount = 0;
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database Name: ${conn.connection.db.databaseName}`);
    
    // Self-healing database cleanup for orphaned staff records
    cleanOrphanedRecords().catch(err => logger.error({ err }, '[Cleanup] Startup execution failed'));
  } catch (error) {
    logger.error({ err: error.message }, 'MongoDB Connection Error');
    retryCount++;
    if (retryCount >= MAX_RETRIES) {
      logger.fatal(`MongoDB failed to connect after ${MAX_RETRIES} attempts. Exiting.`);
      process.exit(1);
    }
    logger.info(`Retrying connection in 5 seconds (attempt ${retryCount}/${MAX_RETRIES})...`);
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;

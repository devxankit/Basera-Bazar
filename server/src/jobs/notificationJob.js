const logger = require('../utils/logger');
const AdminNotification = require('../models/AdminNotification');
const { runPushExecution } = require('../controllers/admin/notificationController');

/**
 * Main execution logic for the scheduled notification job
 */
const runScheduledNotificationJob = async () => {
  logger.info('[NOTIFICATION JOB] Checking for scheduled push notifications...');
  const now = new Date();

  try {
    // Find all notifications that are scheduled and due for sending
    const pendingNotifications = await AdminNotification.find({
      status: 'scheduled',
      scheduled_at: { $lte: now }
    }).sort({ scheduled_at: 1 });

    if (pendingNotifications.length === 0) {
      return;
    }

    logger.info(`[NOTIFICATION JOB] Found ${pendingNotifications.length} scheduled notifications to process.`);

    for (const notif of pendingNotifications) {
      try {
        // Atomic lock to prevent concurrent double-processing in multi-instance environments
        const lockedNotif = await AdminNotification.findOneAndUpdate(
          { _id: notif._id, status: 'scheduled' },
          { $set: { status: 'processing' } },
          { new: true }
        );

        if (!lockedNotif) {
          continue; // Already picked up by another worker instance
        }

        logger.info(`[NOTIFICATION JOB] Processing notification: ${notif._id} - "${notif.title}"`);
        
        // Execute the push broadcast (updates status and counts upon completion)
        await runPushExecution(lockedNotif);
      } catch (err) {
        logger.error({ err, notificationId: notif._id }, `[NOTIFICATION JOB] Error processing notification ${notif._id}`);
      }
    }
  } catch (error) {
    logger.error({ err: error }, '[NOTIFICATION JOB] Unhandled error during scheduled check');
  }
};

/**
 * Registers the job to start on application initialization
 */
const scheduleNotificationJob = () => {
  // Run once shortly after startup (10 seconds)
  setTimeout(() => {
    runScheduledNotificationJob().catch((err) =>
      logger.error({ err }, '[NOTIFICATION JOB] Startup execution failed')
    );
  }, 10000);

  // Then check every 60 seconds (1 minute)
  setInterval(() => {
    runScheduledNotificationJob().catch((err) =>
      logger.error({ err }, '[NOTIFICATION JOB] Interval execution failed')
    );
  }, 60 * 1000);
};

module.exports = { scheduleNotificationJob, runScheduledNotificationJob };

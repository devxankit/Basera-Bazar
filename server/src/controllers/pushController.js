const { User } = require('../models/User');
const logger = require('../utils/logger');
const { Partner } = require('../models/Partner');
const { sendPushNotification } = require('../services/firebaseAdmin');

/**
 * @desc    Save FCM Token for User or Partner
 * @route   POST /api/push/save
 */
exports.saveFCMToken = async (req, res) => {
  try {
    const { token, platform = 'web' } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role; // Assuming role is in token/request

    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    const normalizedRole = userRole?.toLowerCase();
    let recipient;

    if (normalizedRole === 'partner') {
      recipient = await Partner.findById(userId);
    } else if (normalizedRole === 'executive') {
      const Executive = require('../models/Executive');
      recipient = await Executive.findById(userId);
    } else if (normalizedRole === 'team_leader') {
      const { TeamLeader } = require('../models/Staff');
      recipient = await TeamLeader.findById(userId);
    } else if (normalizedRole === 'office_staff') {
      const { OfficeStaff } = require('../models/Staff');
      recipient = await OfficeStaff.findById(userId);
    } else if (['super_admin', 'superadmin', 'admin'].includes(normalizedRole)) {
      const { AdminUser } = require('../models/Admin');
      recipient = await AdminUser.findById(userId);
    } else {
      recipient = await User.findById(userId);
    }

    logger.info({ userId, userRole, platform, tokenFound: !!token }, '[Push] Attempting to save FCM token');

    if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found' });

    // Executive model only has fcmTokens (no fcmTokenMobile), always fall back to fcmTokens
    const tokenField = (platform === 'mobile' && recipient.fcmTokenMobile !== undefined) ? 'fcmTokenMobile' : 'fcmTokens';

    // Initialize array if not exists
    if (!recipient[tokenField]) recipient[tokenField] = [];

    // Add token if not already present
    if (!recipient[tokenField].includes(token)) {
      recipient[tokenField].push(token);
      
      // Limit tokens per user to 10 to avoid performance issues
      if (recipient[tokenField].length > 10) {
        recipient[tokenField] = recipient[tokenField].slice(-10);
      }
      
      await recipient.save();
    }

    res.status(200).json({ success: true, message: 'FCM token saved successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Error saving FCM token:')
    res.status(500).json({ success: false, message: 'Failed to save FCM token' });
  }
};

/**
 * @desc    Remove FCM Token (on logout)
 * @route   DELETE /api/push/remove
 */
exports.removeFCMToken = async (req, res) => {
  try {
    const { token, platform = 'web' } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    let recipient;
    const normalizedRole = userRole?.toLowerCase();
    if (normalizedRole === 'partner') {
      recipient = await Partner.findById(userId);
    } else if (normalizedRole === 'executive') {
      const Executive = require('../models/Executive');
      recipient = await Executive.findById(userId);
    } else if (normalizedRole === 'team_leader') {
      const { TeamLeader } = require('../models/Staff');
      recipient = await TeamLeader.findById(userId);
    } else if (normalizedRole === 'office_staff') {
      const { OfficeStaff } = require('../models/Staff');
      recipient = await OfficeStaff.findById(userId);
    } else if (['super_admin', 'superadmin', 'admin'].includes(normalizedRole)) {
      const { AdminUser } = require('../models/Admin');
      recipient = await AdminUser.findById(userId);
    } else {
      recipient = await User.findById(userId);
    }

    if (!recipient) return res.status(404).json({ success: false, message: 'User not found' });

    const tokenField = (platform === 'mobile' && recipient.fcmTokenMobile !== undefined) ? 'fcmTokenMobile' : 'fcmTokens';

    if (recipient[tokenField]) {
      recipient[tokenField] = recipient[tokenField].filter(t => t !== token);
      await recipient.save();
    }

    res.status(200).json({ success: true, message: 'FCM token removed' });
  } catch (error) {
    logger.error({ err: error }, 'Error removing FCM token:')
    res.status(500).json({ success: false, message: 'Failed to remove token' });
  }
};

/**
 * @desc    Send Test Notification to Current User
 * @route   POST /api/push/test
 */
exports.sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let recipient;
    const normalizedRole = userRole?.toLowerCase();
    if (normalizedRole === 'partner') {
      recipient = await Partner.findById(userId);
    } else if (normalizedRole === 'executive') {
      const Executive = require('../models/Executive');
      recipient = await Executive.findById(userId);
    } else if (normalizedRole === 'team_leader') {
      const { TeamLeader } = require('../models/Staff');
      recipient = await TeamLeader.findById(userId);
    } else if (normalizedRole === 'office_staff') {
      const { OfficeStaff } = require('../models/Staff');
      recipient = await OfficeStaff.findById(userId);
    } else if (['super_admin', 'superadmin', 'admin'].includes(normalizedRole)) {
      const { AdminUser } = require('../models/Admin');
      recipient = await AdminUser.findById(userId);
    } else {
      recipient = await User.findById(userId);
    }

    if (!recipient) return res.status(404).json({ success: false, message: 'User not found' });

    const tokens = [
      ...(recipient.fcmTokens || []),
      ...(recipient.fcmTokenMobile || [])
    ];

    const uniqueTokens = [...new Set(tokens)].filter(t => t);

    if (uniqueTokens.length === 0) {
      return res.status(400).json({ success: false, message: 'No registered tokens found for your account' });
    }

    const response = await sendPushNotification(uniqueTokens, {
      title: 'Basera Bazar Test',
      body: 'This is a test notification from the new FCM system! 🚀',
      data: {
        type: 'test',
        time: new Date().toISOString()
      }
    });

    if (!response) {
      return res.status(500).json({ success: false, message: 'Push service unavailable. Check Firebase Admin configuration.' });
    }

    // Remove tokens FCM rejected as invalid/unregistered so future sends are accurate
    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code;
        logger.warn({ token: uniqueTokens[i], err: code }, '[Push] Test token delivery failed');
        if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
          invalidTokens.push(uniqueTokens[i]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      if (recipient.fcmTokens) recipient.fcmTokens = recipient.fcmTokens.filter(t => !invalidTokens.includes(t));
      if (recipient.fcmTokenMobile) recipient.fcmTokenMobile = recipient.fcmTokenMobile.filter(t => !invalidTokens.includes(t));
      await recipient.save();
    }

    if (response.successCount === 0) {
      return res.status(502).json({
        success: false,
        message: `Notification rejected by FCM for all ${response.failureCount} device(s). Stale tokens were cleared — re-open the app to re-register, then try again.`
      });
    }

    res.status(200).json({
      success: true,
      message: `Test notification delivered to ${response.successCount} of ${uniqueTokens.length} device(s)` +
        (response.failureCount > 0 ? ` (${response.failureCount} failed)` : '')
    });
  } catch (error) {
    logger.error({ err: error }, 'Error sending test notification:')
    res.status(500).json({ success: false, message: 'Test failed' });
  }
};

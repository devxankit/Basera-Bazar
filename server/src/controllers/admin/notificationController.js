const AdminNotification = require('../../models/AdminNotification');
const logger = require('../../utils/logger');

/**
 * Helper to process the actual push broadcast delivery in the background
 */
const runPushExecution = async (adminNotification) => {
  let tokens = [];
  const { title, body, data, target_type } = adminNotification;

  try {
    if (target_type === 'specific_user') {
      const modelToType = {
        'User': 'user',
        'Partner': 'partner',
        'Executive': 'executive',
        'TeamLeader': 'team_leader',
        'OfficeStaff': 'office_staff'
      };
      const recipientType = modelToType[adminNotification.target_user_model] || 'user';
      const { createNotification } = require('../../utils/notificationHelper');
      
      const resNotification = await createNotification(
        recipientType,
        adminNotification.target_user_id,
        title,
        body,
        data
      );
      
      adminNotification.status = 'sent';
      adminNotification.sent_count = resNotification ? 1 : 0;
      adminNotification.success_count = resNotification ? 1 : 0;
      adminNotification.failure_count = resNotification ? 0 : 1;
      await adminNotification.save();
      return;
    }

    // Role-based broadcast queries
    if (target_type === 'all_customers') {
      const { User } = require('../../models/User');
      const users = await User.find({ role: 'Customer', is_blocked: { $ne: true } }).select('fcmTokens fcmTokenMobile');
      users.forEach(u => {
        if (u.fcmTokens) tokens.push(...u.fcmTokens);
        if (u.fcmTokenMobile) tokens.push(...u.fcmTokenMobile);
      });
    } else if (target_type === 'all_partners') {
      const { Partner } = require('../../models/Partner');
      const partners = await Partner.find({ onboarding_status: 'approved', is_blocked: { $ne: true } }).select('fcmTokens fcmTokenMobile');
      partners.forEach(p => {
        if (p.fcmTokens) tokens.push(...p.fcmTokens);
        if (p.fcmTokenMobile) tokens.push(...p.fcmTokenMobile);
      });
    } else if (target_type === 'all_executives') {
      const Executive = require('../../models/Executive');
      const executives = await Executive.find({ onboarding_status: { $in: ['approved', 'verified'] }, is_active: { $ne: false } }).select('fcmTokens');
      executives.forEach(e => {
        if (e.fcmTokens) tokens.push(...e.fcmTokens);
      });
    } else if (target_type === 'all_team_leaders') {
      const { TeamLeader } = require('../../models/Staff');
      const tls = await TeamLeader.find({ onboarding_status: 'approved', is_active: { $ne: false } }).select('fcmTokens');
      tls.forEach(tl => {
        if (tl.fcmTokens) tokens.push(...tl.fcmTokens);
      });
    } else if (target_type === 'all_office_staff') {
      const { OfficeStaff } = require('../../models/Staff');
      const oss = await OfficeStaff.find({ onboarding_status: 'approved', is_active: { $ne: false } }).select('fcmTokens');
      oss.forEach(os => {
        if (os.fcmTokens) tokens.push(...os.fcmTokens);
      });
    }

    const uniqueTokens = [...new Set(tokens)].filter(t => t && t.trim().length > 0);

    if (uniqueTokens.length === 0) {
      adminNotification.status = 'sent';
      adminNotification.sent_count = 0;
      adminNotification.success_count = 0;
      adminNotification.failure_count = 0;
      await adminNotification.save();
      return;
    }

    // Segment tokens into chunks of 500 as required by FCM
    const chunkSize = 500;
    let successCount = 0;
    let failureCount = 0;
    const { sendPushNotification } = require('../../services/firebaseAdmin');

    for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
      const chunk = uniqueTokens.slice(i, i + chunkSize);
      try {
        const response = await sendPushNotification(chunk, {
          title,
          body,
          data: data || {}
        });
        if (response) {
          successCount += response.successCount || 0;
          failureCount += response.failureCount || 0;
        } else {
          failureCount += chunk.length;
        }
      } catch (err) {
        logger.error({ err }, `[FCM Broadcast] Error sending chunk starting at index ${i}`);
        failureCount += chunk.length;
      }
    }

    adminNotification.status = 'sent';
    adminNotification.sent_count = uniqueTokens.length;
    adminNotification.success_count = successCount;
    adminNotification.failure_count = failureCount;
    await adminNotification.save();
  } catch (error) {
    logger.error({ err: error, notificationId: adminNotification._id }, '[FCM Broadcast] Processing failed');
    adminNotification.status = 'failed';
    await adminNotification.save().catch(() => {});
  }
};

/**
 * Search users by role & query (name/phone)
 */
exports.searchRecipients = async (req, res) => {
  try {
    const { role, q } = req.query;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role parameter is required' });
    }

    const query = q ? q.trim() : '';
    const filter = {};
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }

    let results = [];

    if (role === 'Customer') {
      const { User } = require('../../models/User');
      results = await User.find({ ...filter, role: 'Customer' })
        .limit(20)
        .select('_id name phone fcmTokens fcmTokenMobile');
    } else if (role === 'Partner') {
      const { Partner } = require('../../models/Partner');
      results = await Partner.find(filter)
        .limit(20)
        .select('_id name phone fcmTokens fcmTokenMobile roles onboarding_status');
    } else if (role === 'Executive') {
      const Executive = require('../../models/Executive');
      results = await Executive.find(filter)
        .limit(20)
        .select('_id name phone fcmTokens onboarding_status');
    } else if (role === 'TeamLeader') {
      const { TeamLeader } = require('../../models/Staff');
      results = await TeamLeader.find(filter)
        .limit(20)
        .select('_id name phone fcmTokens onboarding_status');
    } else if (role === 'OfficeStaff') {
      const { OfficeStaff } = require('../../models/Staff');
      results = await OfficeStaff.find(filter)
        .limit(20)
        .select('_id name phone fcmTokens onboarding_status');
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const mapped = results.map(item => {
      const tokensCount = (item.fcmTokens || []).length + (item.fcmTokenMobile || []).length;
      return {
        id: item._id,
        name: item.name,
        phone: item.phone,
        hasTokens: tokensCount > 0,
        tokensCount: tokensCount,
        role: role,
        details: item.roles ? item.roles.join(', ') : item.onboarding_status || ''
      };
    });

    res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    logger.error({ err: error }, 'Error searching push notification recipients');
    res.status(500).json({ success: false, message: 'Failed to search recipients' });
  }
};

/**
 * Trigger or schedule broadcast push notification
 */
exports.sendPushBroadcast = async (req, res) => {
  try {
    const { targetType, targetRole, specificUserId, specificUserModel, title, body, redirectUrl, scheduledAt } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and Body are required' });
    }

    if (targetType === 'specific' && (!specificUserId || !specificUserModel)) {
      return res.status(400).json({ success: false, message: 'Specific recipient details are required' });
    }

    if (targetType === 'role' && !targetRole) {
      return res.status(400).json({ success: false, message: 'Target role is required' });
    }

    let resolvedTargetType;
    let targetUserName = '';

    if (targetType === 'specific') {
      resolvedTargetType = 'specific_user';
      if (specificUserModel === 'User') {
        const { User } = require('../../models/User');
        const user = await User.findById(specificUserId).select('name');
        if (user) targetUserName = user.name;
      } else if (specificUserModel === 'Partner') {
        const { Partner } = require('../../models/Partner');
        const partner = await Partner.findById(specificUserId).select('name');
        if (partner) targetUserName = partner.name;
      } else if (specificUserModel === 'Executive') {
        const Executive = require('../../models/Executive');
        const exec = await Executive.findById(specificUserId).select('name');
        if (exec) targetUserName = exec.name;
      } else if (specificUserModel === 'TeamLeader') {
        const { TeamLeader } = require('../../models/Staff');
        const tl = await TeamLeader.findById(specificUserId).select('name');
        if (tl) targetUserName = tl.name;
      } else if (specificUserModel === 'OfficeStaff') {
        const { OfficeStaff } = require('../../models/Staff');
        const os = await OfficeStaff.findById(specificUserId).select('name');
        if (os) targetUserName = os.name;
      }

      if (!targetUserName) {
        return res.status(404).json({ success: false, message: 'Target recipient not found' });
      }
    } else {
      const roleMap = {
        'Customer': 'all_customers',
        'Partner': 'all_partners',
        'Executive': 'all_executives',
        'TeamLeader': 'all_team_leaders',
        'OfficeStaff': 'all_office_staff'
      };
      resolvedTargetType = roleMap[targetRole];
      if (!resolvedTargetType) {
        return res.status(400).json({ success: false, message: 'Invalid target role specified' });
      }
    }

    const dataPayload = {};
    if (redirectUrl) {
      dataPayload.click_action = redirectUrl;
    }

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    const adminNotification = new AdminNotification({
      sender_id: req.user.id,
      title,
      body,
      target_type: resolvedTargetType,
      target_user_id: targetType === 'specific' ? specificUserId : undefined,
      target_user_model: targetType === 'specific' ? specificUserModel : undefined,
      target_user_name: targetType === 'specific' ? targetUserName : undefined,
      scheduled_at: isScheduled ? new Date(scheduledAt) : new Date(),
      status: isScheduled ? 'scheduled' : 'processing',
      data: dataPayload
    });

    await adminNotification.save();

    if (isScheduled) {
      return res.status(200).json({
        success: true,
        message: 'Notification scheduled successfully',
        data: adminNotification
      });
    }

    // Run sending in the background to prevent request timing out
    runPushExecution(adminNotification).catch(err => {
      logger.error({ err }, 'Error in runPushExecution background promise');
    });

    res.status(200).json({
      success: true,
      message: 'Push notification broadcast initiated successfully',
      data: adminNotification
    });
  } catch (error) {
    logger.error({ err: error }, 'Error sending push broadcast');
    res.status(500).json({ success: false, message: 'Failed to initiate broadcast' });
  }
};

/**
 * Get past broadcast notifications history
 */
exports.getBroadcastHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await AdminNotification.countDocuments();
    const history = await AdminNotification.find()
      .populate('sender_id', 'name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching broadcast history');
    res.status(500).json({ success: false, message: 'Failed to fetch notification history' });
  }
};

// Internal reference for background job execution
exports.runPushExecution = runPushExecution;

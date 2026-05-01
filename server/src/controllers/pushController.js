const { User } = require('../models/User');
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

    // Find the correct model based on role
    // In this app, Partners and Users are in different collections
    let recipient;
    let Model;

    // Check if it's a partner role
    const partnerRoles = ['Agent', 'Supplier', 'Service Provider', 'mandi_seller'];
    if (partnerRoles.includes(userRole) || req.user.partner_id) {
      Model = Partner;
      recipient = await Partner.findById(userId);
    } else {
      Model = User;
      recipient = await User.findById(userId);
    }

    if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found' });

    const tokenField = platform === 'mobile' ? 'fcmTokenMobile' : 'fcmTokens';
    
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
    console.error('Error saving FCM token:', error);
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

    let recipient = await User.findById(userId) || await Partner.findById(userId);
    if (!recipient) return res.status(404).json({ success: false, message: 'User not found' });

    const tokenField = platform === 'mobile' ? 'fcmTokenMobile' : 'fcmTokens';
    
    if (recipient[tokenField]) {
      recipient[tokenField] = recipient[tokenField].filter(t => t !== token);
      await recipient.save();
    }

    res.status(200).json({ success: true, message: 'FCM token removed' });
  } catch (error) {
    console.error('Error removing FCM token:', error);
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
    const recipient = await User.findById(userId) || await Partner.findById(userId);
    
    if (!recipient) return res.status(404).json({ success: false, message: 'User not found' });

    const tokens = [
      ...(recipient.fcmTokens || []),
      ...(recipient.fcmTokenMobile || [])
    ];

    const uniqueTokens = [...new Set(tokens)].filter(t => t);

    if (uniqueTokens.length === 0) {
      return res.status(400).json({ success: false, message: 'No registered tokens found for your account' });
    }

    await sendPushNotification(uniqueTokens, {
      title: 'Basera Bazar Test',
      body: 'This is a test notification from the new FCM system! 🚀',
      data: {
        type: 'test',
        time: new Date().toISOString()
      }
    });

    res.status(200).json({ success: true, message: `Test notification sent to ${uniqueTokens.length} devices` });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ success: false, message: 'Test failed' });
  }
};

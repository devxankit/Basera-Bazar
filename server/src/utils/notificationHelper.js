const logger = require('./logger');
const { Partner } = require('../models/Partner');
const { User } = require('../models/User');
const { sendPushNotification } = require('../services/firebaseAdmin');

/**
 * @desc    Create an in-app notification for a user or partner and send push if tokens exist
 * @param   {string} recipientType - 'user', 'partner', or 'admin'
 * @param   {string} recipientId - MongoDB ID of the recipient
 * @param   {string} title - Notification title
 * @param   {string} body - Notification message body
 * @param   {object} data - Optional deep link or metadata payload
 */
const createNotification = async (recipientType, recipientId, title, body, data = {}) => {
  const { Notification } = require('../models/System');
  try {
    if (!Notification) {
      throw new Error('Notification model is not defined. Check imports in notificationHelper.js');
    }
    // 1. Create In-App Notification Record
    const notification = await Notification.create({
      recipient_type: recipientType,
      recipient_id: recipientId,
      title,
      body,
      data
    });
    
    logger.info(`[Notification] Created in-app for ${recipientType} (${recipientId}): ${title}`)

    // 2. Fetch Recipient to get FCM Tokens
    let recipient;
    if (recipientType === 'partner') {
      recipient = await Partner.findById(recipientId);
    } else {
      recipient = await User.findById(recipientId);
    }

    if (recipient) {
      const tokens = [
        ...(recipient.fcmTokens || []),
        ...(recipient.fcmTokenMobile || [])
      ];

      // Remove duplicates and empty tokens
      const uniqueTokens = [...new Set(tokens)].filter(t => t && t.length > 0);

      if (uniqueTokens.length > 0) {
        logger.info(`[Push Notification] Attempting to send to ${uniqueTokens.length} devices for ${recipientType} ${recipientId}`)
        
        // Prepare payload for FCM (FCM data values must be strings)
        const stringifiedData = {
          notification_id: notification._id.toString(),
          click_action: data.enquiry_id ? `/partner/lead-details/${data.enquiry_id}` :
                        data.type === 'broadcast_lead' ? '/partner/leads' :
                        data.type === 'mandi_order' ? '/partner/marketplace/orders' : '/partner/home'
        };

        // Merge extra data, converting all values to strings for FCM compatibility
        Object.keys(data).forEach(key => {
          stringifiedData[key] = String(data[key]);
        });

        const pushPayload = {
          title,
          body,
          data: stringifiedData
        };

        await sendPushNotification(uniqueTokens, pushPayload);
        
        // Cleanup logic for failed tokens could be added here if needed
        // but admin-sdk's sendEachForMulticast handles basic reporting
      } else {
        logger.info(`[Push Notification] No FCM tokens found for ${recipientType} ${recipientId}`)
      }
    }
    
    return notification;
  } catch (error) {
    console.error('NOTIFICATION ERROR:', error);
    logger.error({ err: error }, 'Error creating notification:')
    return null;
  }
};

module.exports = {
  createNotification
};

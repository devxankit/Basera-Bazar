const { Notification } = require('../models/System');

/**
 * @desc    Create an in-app notification for a user or partner
 * @param   {string} recipientType - 'user', 'partner', or 'admin'
 * @param   {string} recipientId - MongoDB ID of the recipient
 * @param   {string} title - Notification title
 * @param   {string} body - Notification message body
 * @param   {object} data - Optional deep link or metadata payload
 */
const createNotification = async (recipientType, recipientId, title, body, data = {}) => {
  try {
    const notification = await Notification.create({
      recipient_type: recipientType,
      recipient_id: recipientId,
      title,
      body,
      data
    });
    
    // In a real app, logic for Push Notifications (FCM/OneSignal) would go here!
    console.log(`[Notification] Created for ${recipientType} (${recipientId}): ${title}`);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

module.exports = {
  createNotification
};

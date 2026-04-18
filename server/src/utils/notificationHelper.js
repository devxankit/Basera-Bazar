const { Notification } = require('../models/System');
const { Partner } = require('../models/Partner');
const webpush = require('web-push');

// Configure Web Push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:support@baserabazar.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

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
    
    console.log(`[Notification] Created in-app for ${recipientType} (${recipientId}): ${title}`);

    // If it's a partner, try to send real-time Web Push
    if (recipientType === 'partner') {
      const partner = await Partner.findById(recipientId);
      if (partner && partner.push_subscriptions && partner.push_subscriptions.length > 0) {
        console.log(`[Push Notification] Found ${partner.push_subscriptions.length} subscriptions for partner ${recipientId}`);
        const payload = JSON.stringify({
          title,
          body,
          data: {
            ...data,
            notification_id: notification._id,
            url: data.enquiry_id ? `/partner/lead-details/${data.enquiry_id}` : '/partner/home'
          }
        });

        // Track invalid subscriptions to clean them up later
        const staleSubIndices = [];

        await Promise.all(partner.push_subscriptions.map(async (sub, index) => {
          try {
            await webpush.sendNotification(sub, payload);
            console.log(`[Push Notification] Successfully sent to subscription ${index}`);
          } catch (err) {
            console.error(`[Push Notification] Failed for sub ${index}:`, err.statusCode, err.message);
            // If the subscription is no longer valid (expired or revoked), we should remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
              staleSubIndices.push(index);
            }
          }
        }));

        // Cleanup stale subscriptions if any
        if (staleSubIndices.length > 0) {
          partner.push_subscriptions = partner.push_subscriptions.filter((_, idx) => !staleSubIndices.includes(idx));
          await partner.save();
        }
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

module.exports = {
  createNotification
};

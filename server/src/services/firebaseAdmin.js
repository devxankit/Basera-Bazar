const admin = require('firebase-admin');
const path = require('path');

// Try to load service account from environment variable first (recommended for production)
// Otherwise fallback to the config file
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Look for the file in src/config
    serviceAccount = require('../config/firebase-service-account.json');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.warn('⚠️ Push notifications will not work until a valid service account is provided in src/config/firebase-service-account.json');
}

/**
 * Send push notification to multiple tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {object} payload - Notification payload { title, body, data }
 */
async function sendPushNotification(tokens, payload) {
  if (!admin.apps || !admin.apps.length) {
    console.error('Push aborted: Firebase Admin not initialized');
    return null;
  }

  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens: tokens, // Array of FCM tokens
    };

    // Use sendEachForMulticast as per latest FCM SDK
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Successfully sent: ${response.successCount} messages`);
    if (response.failureCount > 0) {
      console.warn(`[FCM] Failed: ${response.failureCount} messages`);
    }
    
    return response;
  } catch (error) {
    console.error('[FCM] Error sending message:', error);
    return null;
  }
}

module.exports = { admin, sendPushNotification };

const admin = require('firebase-admin');
const logger = require('../utils/logger');

// --- Notification sound config ---------------------------------------------
// The app was wrapped natively by a third party, so we cannot assume a custom
// channel or a bundled sound file (res/raw/*) exists. To make sound work
// WITHOUT depending on the native project, we:
//   • use the DEVICE DEFAULT sound ('default'), which always exists, and
//   • only pin a channelId if one is provided via env (so it can be aligned
//     with the native app later WITHOUT a code change). If unset, we omit it
//     and let FCM use the app's default channel, which is IMPORTANCE_DEFAULT
//     (makes a sound) on Android 8+.
// NOTE: on Android 8+ the *channel's* importance/sound is authoritative. If the
// native app created its default channel as silent/low-importance, only the
// Flutter dev can fix that — see the spec returned to the user.
const NOTIFICATION_CHANNEL_ID = process.env.FCM_ANDROID_CHANNEL_ID || null;
const NOTIFICATION_SOUND = process.env.FCM_NOTIFICATION_SOUND || 'default';

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
  logger.info('✅ Firebase Admin initialized successfully')
} catch (error) {
  logger.error({ err: error.message }, '❌ Failed to initialize Firebase Admin:')
  logger.warn('⚠️ Push notifications will not work until a valid service account is provided in src/config/firebase-service-account.json')
}

/**
 * Send push notification to multiple tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {object} payload - Notification payload { title, body, data }
 */
async function sendPushNotification(tokens, payload) {
  if (!admin.apps || !admin.apps.length) {
    logger.error('Push aborted: Firebase Admin not initialized')
    return null;
  }

  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      // Android (native Flutter app): high message priority so it's delivered
      // promptly and can show as a heads-up; default device sound + vibration
      // so audio works without requiring a bundled sound file. channelId is
      // only included when explicitly configured (env), so a wrong/missing
      // channel can never silence or hide the notification.
      android: {
        priority: 'high',
        notification: {
          sound: NOTIFICATION_SOUND,            // 'default' = device sound
          defaultVibrateTimings: true,
          notificationPriority: 'PRIORITY_HIGH', // pre-Android 8 heads-up/sound
          ...(NOTIFICATION_CHANNEL_ID ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
        },
      },
      // iOS (if shipped later): default sound.
      apns: {
        payload: { aps: { sound: 'default' } },
      },
      tokens: tokens, // Array of FCM tokens
    };

    // Use sendEachForMulticast as per latest FCM SDK
    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(`[FCM] Successfully sent: ${response.successCount} messages`)
    if (response.failureCount > 0) {
      logger.warn(`[FCM] Failed: ${response.failureCount} messages`)
    }
    
    return response;
  } catch (error) {
    logger.error({ err: error }, '[FCM] Error sending message:')
    return null;
  }
}

module.exports = { admin, sendPushNotification };

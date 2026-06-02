import { messaging, getToken, onMessage } from '../firebase';
import api from './api';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Register the Firebase messaging service worker
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const configParams = new URLSearchParams({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
      }).toString();

      const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${configParams}`);
      console.log('✅ FCM Service Worker registered');
      return registration;
    } catch (error) {
      console.error('❌ FCM Service Worker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Service Workers are not supported in this browser');
  }
}

/**
 * Request notification permission from the user
 */
async function requestNotificationPermission() {
  if ('Notification' in window) {
    // If already denied, don't ask again and don't log an error
    if (Notification.permission === 'denied') {
      return false;
    }
    
    // Only request if not already decided
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    }
    return false;
  }
  return false;
}

/**
 * Get the unique FCM token for this device
 */
async function getFCMToken() {
  try {
    const registration = await registerServiceWorker();
    
    if (!messaging) {
      console.warn('⚠️ Firebase Messaging is not initialized. Token generation skipped.');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (token) {
      return token;
    } else {
      console.warn('❌ No FCM token available. Check VAPID key or browser support.');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    throw error;
  }
}

/**
 * Register the device token with our backend
 */
async function registerFCMToken(forceUpdate = false, accountId = null) {
  try {
    console.log('[Push] Initializing token registration...');

    // 1. Skip only if THIS account already registered its token this session.
    //    The guard is keyed by accountId so switching accounts in the same
    //    browser (e.g. customer -> partner -> executive) always re-registers
    //    the current device token to the newly logged-in account. A plain
    //    global flag would skip registration after the first login and leave
    //    the other accounts holding only stale tokens.
    const registeredFor = sessionStorage.getItem('fcm_registered_account');
    if (registeredFor && accountId && registeredFor === String(accountId) && !forceUpdate) {
      console.log('[Push] Token already registered for this account this session');
      return localStorage.getItem('last_fcm_token');
    }

    // 2. Request permission
    console.log('[Push] Requesting permission...');
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('[Push] Permission denied or not granted');
      return null;
    }
    
    // 3. Get device token
    console.log('[Push] Getting device token...');
    const token = await getFCMToken();
    if (!token) {
      console.warn('[Push] No token generated');
      return null;
    }
    
    console.log('[Push] Token generated, sending to backend...');
    
    // 4. Send to backend
    const res = await api.post('/push/save', {
      token: token,
      platform: 'web'
    });
    
    if (res.data.success) {
      if (accountId) sessionStorage.setItem('fcm_registered_account', String(accountId));
      localStorage.setItem('last_fcm_token', token); // Useful for logout cleanup
      console.log('✅ FCM token registered with Basera Bazar backend');
      return token;
    } else {
      console.error('[Push] Backend registration failed:', res.data.message);
    }
  } catch (error) {
    console.error('❌ Error registering FCM token:', error);
    // Non-critical error
  }
}

/**
 * Cleanup token on logout
 */
async function unregisterFCMToken() {
  try {
    const token = localStorage.getItem('last_fcm_token');
    sessionStorage.removeItem('fcm_registered_account');
    if (token) {
      await api.delete('/push/remove', { data: { token, platform: 'web' } });
      localStorage.removeItem('last_fcm_token');
      console.log('✅ FCM token removed from server');
    }
  } catch (error) {
    console.error('❌ Error removing FCM token:', error);
  }
}

/**
 * Setup handler for notifications received while app is in foreground
 */
function setupForegroundHandler(onMessageReceived) {
  if (!messaging || typeof onMessage !== 'function') return () => {};
  
  return onMessage(messaging, async (payload) => {
    console.log('📬 Foreground notification:', payload);

    // Show a browser notification manually since the browser won't show it
    // in the foreground automatically. We MUST use the service worker's
    // showNotification() — `new Notification()` throws an "Illegal constructor"
    // error on Android/mobile browsers, so foreground notifications silently
    // fail to display there.
    if (Notification.permission === 'granted' && payload.notification) {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
          || await navigator.serviceWorker.ready;
        await registration.showNotification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/favicon.png',
          data: payload.data
        });
      } catch (err) {
        console.error('❌ Failed to show foreground notification:', err);
      }
    }

    if (onMessageReceived) onMessageReceived(payload);
  });
}

/**
 * Initial setup called on App mount
 */
async function initializeFCM() {
  try {
    if ('serviceWorker' in navigator) {
      await registerServiceWorker();
      // We only register the token if the user is logged in (handled in App.jsx)
    }
  } catch (err) {
    console.error('Push Initialization failed:', err);
  }
}

export {
  initializeFCM,
  registerFCMToken,
  unregisterFCMToken,
  setupForegroundHandler,
  requestNotificationPermission
};

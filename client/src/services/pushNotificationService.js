import { messaging, getToken, onMessage } from '../firebase';
import api from './api';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Register the Firebase messaging service worker
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
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
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      console.warn('❌ Notification permission denied');
      return false;
    }
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
async function registerFCMToken(forceUpdate = false) {
  try {
    // 1. Check if token already exists in session to avoid redundant calls
    const savedToken = sessionStorage.getItem('fcm_token_registered');
    if (savedToken && !forceUpdate) {
      console.log('[Push] Token already registered in this session');
      return savedToken;
    }
    
    // 2. Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;
    
    // 3. Get device token
    const token = await getFCMToken();
    if (!token) return null;
    
    // 4. Send to backend
    const res = await api.post('/push/save', {
      token: token,
      platform: 'web'
    });
    
    if (res.data.success) {
      sessionStorage.setItem('fcm_token_registered', token);
      localStorage.setItem('last_fcm_token', token); // Useful for logout cleanup
      console.log('✅ FCM token registered with Basera Bazar backend');
      return token;
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
    if (token) {
      await api.delete('/push/remove', { data: { token, platform: 'web' } });
      sessionStorage.removeItem('fcm_token_registered');
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
  
  return onMessage(messaging, (payload) => {
    console.log('📬 Foreground notification:', payload);
    
    // Show a browser notification manually since browser won't show it in foreground automatically
    if (Notification.permission === 'granted') {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon || '/favicon.png',
        data: payload.data
      });
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

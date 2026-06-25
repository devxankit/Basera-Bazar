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
  // Arm audio unlocking on the user's first gesture so the notification sound
  // can actually play later (mobile browsers block audio without a gesture).
  installAudioUnlock();

  if (!messaging || typeof onMessage !== 'function') return () => {};

  return onMessage(messaging, async (payload) => {
    console.log('📬 Foreground notification:', payload);

    // When the app is open and focused, the browser renders manually-shown
    // notifications SILENTLY. The Web Notifications API also has no working
    // `sound` option, so the only reliable way to give an audible cue while
    // the app is in the foreground is to play an audio element ourselves.
    // This works because the user has already interacted with the page,
    // which satisfies the browser autoplay policy.
    playNotificationSound();

    // Show a browser notification manually since the browser won't show it
    // in the foreground automatically. We MUST use the service worker's
    // showNotification() — `new Notification()` throws an "Illegal constructor"
    // error on Android/mobile browsers, so foreground notifications silently
    // fail to display there.
    if ('Notification' in window && Notification.permission === 'granted' && payload.notification) {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
          || await navigator.serviceWorker.ready;
        await registration.showNotification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/favicon.png',
          data: payload.data,
          // Haptic feedback on Android (ignored where unsupported). Combined
          // with renotify+tag so repeat notifications still alert the user.
          vibrate: [200, 100, 200],
          tag: payload.data?.notification_id || 'basera-notification',
          renotify: true
        });
      } catch (err) {
        console.error('❌ Failed to show foreground notification:', err);
      }
    }

    if (onMessageReceived) onMessageReceived(payload);
  });
}

/**
 * Play an in-app notification sound + vibrate. Tries a `notification.mp3`
 * from client/public/ first (drop one in to customise the tone); if it is
 * missing or blocked, falls back to a short synthesized chime via the Web
 * Audio API so a cue always plays. All failures are non-fatal.
 */
// --- Audio unlock (mobile autoplay policy) ---------------------------------
// A push arrives in an async callback with NO active user gesture. Mobile
// browsers block audio that isn't tied to a gesture: `Audio.play()` rejects
// and a fresh AudioContext starts "suspended" (silent). The fix is to PRIME
// audio during the user's first interaction with the page and reuse those
// already-unlocked objects when a notification later arrives.
let _notificationAudio;
let _audioCtx = null;
let _audioUnlocked = false;
let _unlockInstalled = false;

function getAudioCtx() {
  if (!_audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) _audioCtx = new Ctx();
  }
  return _audioCtx;
}

/**
 * Attach one-shot listeners that unlock audio on the user's first gesture.
 * Safe to call repeatedly; only installs once.
 */
function installAudioUnlock() {
  if (_unlockInstalled || typeof window === 'undefined') return;
  _unlockInstalled = true;

  const events = ['pointerdown', 'touchend', 'click', 'keydown'];
  const unlock = () => {
    try {
      // Resume the Web Audio context (chime fallback) from within the gesture.
      const ctx = getAudioCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});

      // Prime the mp3 element: a muted play()/pause() inside the gesture marks
      // it "user-activated" so a later programmatic play() is allowed.
      if (!_notificationAudio) {
        _notificationAudio = new Audio('/notification.mp3');
        _notificationAudio.preload = 'auto';
      }
      _notificationAudio.muted = true;
      const p = _notificationAudio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          _notificationAudio.pause();
          _notificationAudio.currentTime = 0;
          _notificationAudio.muted = false;
        }).catch(() => { _notificationAudio.muted = false; });
      }
      _audioUnlocked = true;
    } catch { /* non-fatal */ }
    events.forEach((ev) => window.removeEventListener(ev, unlock));
  };

  events.forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
}

/**
 * Play an in-app notification sound + vibrate. Tries `notification.mp3` first
 * (drop one into client/public/ to customise the tone); if it is missing or
 * blocked, falls back to a synthesized chime. Relies on audio having been
 * unlocked by an earlier user gesture (see installAudioUnlock). All failures
 * are non-fatal.
 */
function playNotificationSound() {
  try {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    if (!_notificationAudio) {
      _notificationAudio = new Audio('/notification.mp3');
      _notificationAudio.preload = 'auto';
    }
    _notificationAudio.muted = false;
    _notificationAudio.currentTime = 0;
    const playPromise = _notificationAudio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      // mp3 missing (404) or play blocked → synthesized fallback.
      playPromise.catch(() => playBeep());
    }
  } catch (err) {
    playBeep();
  }
}

/**
 * Synthesize a short two-note chime with the Web Audio API. Reuses the
 * unlocked, persistent AudioContext so it stays audible on mobile.
 */
function playBeep() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
    // NOTE: do not close the context — it is reused for future notifications.
  } catch (err) {
    console.warn('🔇 Could not play notification sound:', err?.message || err);
  }
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

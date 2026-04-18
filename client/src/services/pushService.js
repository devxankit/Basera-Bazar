import api from './api';

const VAPID_PUBLIC_KEY = 'BCrNL5o7cnpit7DvJ-l-UhOs8L7CirtUSGimDqupq8PV24XQpja1qmzKfyZuQFOBD3_SGgrYTsHdzG5QOL0EY5M';

/**
 * Register the Service Worker and subscribe to Push Notifications
 */
export const subscribeToNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push Service] Not supported in this browser.');
    return;
  }

  try {
    console.log('[Push Service] Starting registration...');
    
    if (!window.isSecureContext) {
      console.error('[Push Service] Browser blocked push - requires HTTPS.');
      return;
    }

    // 1. Register Service Worker with absolute path
    const swUrl = `${window.location.origin}/sw.js`;
    const registration = await navigator.serviceWorker.register(swUrl);
    console.log('[Push Service] SW registered:', registration.scope);

    // 2. Wait for activation
    await navigator.serviceWorker.ready;
    console.log('[Push Service] SW ready');

    // 3. Request Permission
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    console.log('[Push Service] Permission status:', permission);
    
    if (permission !== 'granted') {
      console.warn('[Push Service] Permission not granted.');
      if (permission === 'denied') {
        console.info('Notifications are blocked. Please enable them in browser settings.');
      }
      return;
    }

    // 4. Subscribe with VAPID
    console.log('[Push Service] Subscribing to Push Manager...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('[Push Service] Subscription obtained:', !!subscription);

    // 5. Send to backend
    const response = await api.post('/push/subscribe', subscription);
    if (response.data.success) {
      console.log('[Push Service] Successfully synced with backend.');
    }

  } catch (error) {
    console.error('[Push Service] Critical subscription error:', error);
  }
};

/**
 * Helper to convert VAPID key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

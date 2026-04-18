import api from './api';

const VAPID_PUBLIC_KEY = 'BCrNL5o7cnpit7DvJ-l-UhOs8L7CirtUSGimDqupq8PV24XQpja1qmzKfyZuQFOBD3_SGgrYTsHdzG5QOL0EY5M';

/**
 * Register the Service Worker and subscribe to Push Notifications
 */
export const subscribeToNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported in this browser.');
    return;
  }

  try {
    // 1. Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    // 2. Wait for it to be active
    await navigator.serviceWorker.ready;

    // 3. Request Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied.');
      return;
    }

    // 4. Subscribe to Push Manager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // 5. Send subscription to our backend
    await api.post('/push/subscribe', subscription);
    console.log('[Push Service] Successfully registered push subscription.');

  } catch (error) {
    console.error('[Push Service] Error subscribing to push:', error);
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

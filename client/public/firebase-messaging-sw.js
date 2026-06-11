// Import Firebase scripts (Compat version is required for importScripts style)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Extract Firebase configuration dynamically from registration URL query parameters
const url = new URL(self.location.href);
const firebaseConfig = {
  apiKey: url.searchParams.get('apiKey') || "AIzaSyCEXmUNDI9JQJaK5mZk-_tnF-hCIxmcO_U",
  authDomain: url.searchParams.get('authDomain') || "basera-bazar.firebaseapp.com",
  projectId: url.searchParams.get('projectId') || "basera-bazar",
  storageBucket: url.searchParams.get('storageBucket') || "basera-bazar.firebasestorage.app",
  messagingSenderId: url.searchParams.get('messagingSenderId') || "570105453591",
  appId: url.searchParams.get('appId') || "1:570105453591:web:558e2f23fecfb90c2b9052",
  measurementId: url.searchParams.get('measurementId') || "G-G1CYH0CRGR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
// NOTE: On Android WebView/TWA, sound for background notifications is controlled by
// the browser's (Chrome's) default notification channel — NOT by JS. The browser
// uses IMPORTANCE_HIGH by default for push notifications, which includes sound.
// We must NOT pass a custom channelId here (that would require native channel creation).
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);

  // Support both notification payloads and data-only payloads (Android sends data-only
  // for background messages in some WebView configurations)
  const title = payload.notification?.title || payload.data?.title || 'Basera Bazar';
  const body  = payload.notification?.body  || payload.data?.body  || 'You have a new notification';
  const icon  = payload.notification?.icon  || '/favicon.png';

  const notificationOptions = {
    body,
    icon,
    data: payload.data || {},
    // vibrate works on Android Chrome and signals the OS to use sound+vibration
    // from the browser's default HIGH-importance notification channel
    vibrate: [200, 100, 200],
    tag: payload.data?.notification_id || 'basera-notification',
    renotify: true,
    // badge helps Android show the notification dot
    badge: '/favicon.png'
  };

  self.registration.showNotification(title, notificationOptions);
});


// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  // click_action is set by our backend notificationHelper
  const urlToOpen = data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

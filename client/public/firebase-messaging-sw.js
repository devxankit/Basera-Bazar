// Import Firebase scripts (Compat version is required for importScripts style)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

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
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/favicon.png',
    data: payload.data,
    // Haptic feedback on Android (ignored where unsupported). The actual
    // notification *sound* for background messages is controlled by the OS
    // notification channel / device settings — it cannot be set from JS.
    vibrate: [200, 100, 200],
    tag: payload.data?.notification_id || 'basera-notification',
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
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

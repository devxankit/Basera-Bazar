// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js');

/**
 * Firebase configuration
 * IMPORTANT: You must replace these with your actual Firebase config values
 * from the Firebase Console (Project Settings > General > Your Apps)
 */
const firebaseConfig = {
  apiKey: "AIzaSyCEXmUNDI9JQJaK5mZk-_tnF-hCIxmcO_U",
  authDomain: "basera-bazar.firebaseapp.com",
  projectId: "basera-bazar",
  storageBucket: "basera-bazar.firebasestorage.app",
  messagingSenderId: "570105453591",
  appId: "1:570105453591:web:558e2f23fecfb90c2b9052",
  measurementId: "G-G1CYH0CRGR"
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
    data: payload.data
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

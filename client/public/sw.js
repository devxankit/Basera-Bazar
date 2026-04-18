/* eslint-disable no-restricted-globals */
self.addEventListener('push', function(event) {
  if (event.data) {
    const payload = event.data.json();
    console.log('[Service Worker] Push Received:', payload);

    const title = payload.title || 'BaseraBazar Alert';
    const options = {
      body: payload.body || 'You have a new notification.',
      icon: '/baseralogo.png', // Fallback to standard logo
      badge: '/baseralogo.png',
      data: payload.data || {},
      vibrate: [100, 50, 100],
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'close', title: 'Close' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/partner/home';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open with the target URL, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

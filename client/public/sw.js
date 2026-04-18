/* eslint-disable no-restricted-globals */
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Event Received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('[Service Worker] Push Payload:', data);
    } catch (e) {
      console.error('[Service Worker] Push data is not JSON:', event.data.text());
      data = { title: 'New Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'BaseraBazar Alert';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/baseralogo.png',
    badge: '/baseralogo.png',
    data: data.data || {},
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View Details' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification Clicked:', event.notification);
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url ? new URL(data.url, self.location.origin).href : self.location.origin + '/partner/home';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Look for any existing tab that matches the URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If none found, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

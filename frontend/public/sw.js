// my-app/frontend/public/sw.js
self.addEventListener('push', function(event) {
  let data = { title: 'Lembrete Financeiro', body: 'Você tem uma nova notificação!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch(e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/financas/favicon.svg',
    badge: '/financas/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/financas/planning'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

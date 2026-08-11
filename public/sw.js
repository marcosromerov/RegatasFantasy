// Service worker: PWA install + Web Push notifications

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// Push: el servidor manda un push vacío (sin payload cifrado),
// el SW siempre muestra la misma notificación de "puntos cargados".
self.addEventListener('push', (event) => {
  let title = '¡Puntos cargados! 🏉';
  let body = 'Los resultados de la fecha ya están disponibles. Revisá cómo rindió tu equipo.';
  let url = '/';

  // Si el servidor mandó payload JSON, lo usamos.
  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) body = data.body;
      if (data.url) url = data.url;
    } catch { /* payload no JSON, usamos defaults */ }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon.jpg',
      badge: '/icon.jpg',
      tag: 'puntos-cargados',    // reemplaza notificaciones anteriores del mismo tipo
      renotify: true,
      data: { url },
    })
  );
});

// Al tocar la notificación: foco/abre la app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si la app ya está abierta, le damos foco.
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      // Si no, la abrimos.
      return clients.openWindow(event.notification.data?.url ?? '/');
    })
  );
});

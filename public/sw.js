// Service worker mínimo: habilita que la app sea "instalable" (PWA) sin cachear
// agresivamente (evita quedar con versiones viejas). Solo hace passthrough a la red.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

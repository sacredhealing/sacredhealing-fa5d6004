// Self-destructing service worker: unregisters itself and clears all caches
// This ensures users always get the latest version of the app
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))),
      self.registration.unregister(),
    ])
  );
});

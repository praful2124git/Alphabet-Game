
// Service Worker for Name Place Animal Thing
const CACHE_NAME = 'npat-game-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Basic network-first strategy
  // We use fetch(event.request) directly to avoid caching issues during development
  // but the existence of this fetch handler satisfies PWA requirements.
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("You are offline. Connect to the internet to play.");
    })
  );
});

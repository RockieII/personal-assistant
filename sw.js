// Service Worker for Personal Assistant PWA
// Handles: offline caching + notification clicks

const CACHE_NAME = 'personal-assistant-v2';

// All files that make up the app shell (needed to run offline)
const CACHED_URLS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './js/db.js',
  './js/i18n.js',
  './js/event-types.js',
  './js/events.js',
  './js/notifications.js',
  './js/calendar.js',
  './js/app.js',
];

// Install: download and cache all app files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHED_URLS))
  );
  self.skipWaiting(); // activate immediately
});

// Activate: delete old caches from previous versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control of open pages immediately
});

// Fetch: serve from cache first, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// Notification click: focus the app or open it
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      if (windowClients.length > 0) return windowClients[0].focus();
      return clients.openWindow('./');
    })
  );
});

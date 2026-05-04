// ================================================
// MALO CAFE — SERVICE WORKER
// Serves custom offline page when there's no internet
// ================================================

var CACHE_NAME = 'malo-cafe-v1';

// Files to cache so they're available offline
var CACHE_FILES = [
  '/',
  '/index.html',
  '/status-offline.html',
  '/style.css',
  '/status.css',
  '/script.js',
  '/images/Notfound.gif',
  '/images/nav-logo.png',
  '/images/logo.ico'
];

// ── Install: cache all essential files ──────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ───────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch: serve from cache or show offline page ─
self.addEventListener('fetch', function(e) {
  // Only handle GET requests for same-origin pages
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Request succeeded — clone and cache it
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, copy);
        });
        return response;
      })
      .catch(function() {
        // No internet — serve from cache if available
        return caches.match(e.request).then(function(cached) {
          if (cached) return cached;
          // Not in cache — show offline page
          return caches.match('/status-offline.html');
        });
      })
  );
});

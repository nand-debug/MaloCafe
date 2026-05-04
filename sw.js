// ================================================
// MALO CAFE — SERVICE WORKER v3 (FIXED)
// Fixes:
// - Response.clone() crash
// - Double cloning issue
// - Safer caching strategy
// - Stable PWA behavior
// ================================================

var CACHE_VERSION = 'v4';
var CACHE_NAME = 'malo-cafe-' + CACHE_VERSION;

// Core shell files
var SHELL_FILES = [
  '/index.html',
  '/about.html',
  '/booking.html',
  '/contact.html',
  '/gallery.html',
  '/review.html',
  '/404.html',
  '/status-offline.html',
  '/preloader.html',
  '/status-loading.html',
  '/style.css',
  '/status.css',
  '/script.js',
  '/status.js',
  '/images/nav-logo.png',
  '/images/Notfound.gif',
  '/images/favicon_io/favicon-32x32.png'
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept') &&
      request.headers.get('accept').includes('text/html'));
}

/**
 * SAFE cache function (ONLY ONE clone happens here)
 */
function cacheValidResponse(request, response) {
  if (!response || response.status !== 200 || response.type === 'error') return;

  const responseToCache = response.clone();

  caches.open(CACHE_NAME).then(function (cache) {
    cache.put(request, responseToCache);
  });
}

// ─────────────────────────────────────────────
// INSTALL
// ─────────────────────────────────────────────
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(SHELL_FILES);
      })
      .then(function () {
        return self.skipWaiting();
      })
      .catch(function (err) {
        console.error('[SW] Install failed:', err);
        throw err;
      })
  );
});

// ─────────────────────────────────────────────
// ACTIVATE
// ─────────────────────────────────────────────
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ─────────────────────────────────────────────
// FETCH (FIXED CLONE BUG HERE)
// ─────────────────────────────────────────────
self.addEventListener('fetch', function (event) {

  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // ───────────── HTML NAVIGATION ─────────────
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          cacheValidResponse(event.request, response); // SAFE
          return response;
        })
        .catch(function () {
          return caches.match(event.request)
            .then(function (cached) {
              return cached || caches.match('/status-offline.html');
            });
        })
    );
    return;
  }

  // ───────────── ASSETS (CSS/JS/IMG) ─────────────
  event.respondWith(
    caches.match(event.request)
      .then(function (cached) {
        if (cached) return cached;

        return fetch(event.request)
          .then(function (response) {

            // SAFE: only ONE clone inside helper
            cacheValidResponse(event.request, response);

            return response;
          })
          .catch(function () {

            // fallback image
            if (event.request.destination === 'image') {
              return new Response(
                atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
                { headers: { 'Content-Type': 'image/gif' } }
              );
            }

            return new Response('', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
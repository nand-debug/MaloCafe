// ================================================
// MALO CAFE — SERVICE WORKER v4 (GITHUB PAGES FIXED)
// ================================================

var CACHE_VERSION = 'v4';
var CACHE_NAME = 'malo-cafe-' + CACHE_VERSION;

// IMPORTANT: use RELATIVE paths (NO leading /)
var SHELL_FILES = [
  'index.html',
  'about.html',
  'booking.html',
  'contact.html',
  'gallery.html',
  'review.html',
  '404.html',
  'status-offline.html',
  'preloader.html',
  'status-loading.html',

  'style.css',
  'status.css',
  'script.js',
  'status.js',

  'images/nav-logo.png',
  'images/Notfound.gif',
  'images/favicon_io/favicon-32x32.png'
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

function cacheValidResponse(request, response) {
  if (!response || response.status !== 200 || response.type === 'error') return;

  var clone = response.clone();

  caches.open(CACHE_NAME).then(function (cache) {
    cache.put(request, clone);
  });
}

// ─────────────────────────────────────────────
// INSTALL
// ─────────────────────────────────────────────
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_FILES);
    }).then(function () {
      return self.skipWaiting();
    }).catch(function (err) {
      console.error('[SW] Install failed:', err);
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
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ─────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────
self.addEventListener('fetch', function (event) {

  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // ───────────── NAVIGATION ─────────────
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          cacheValidResponse(event.request, response);
          return response;
        })
        .catch(function () {
          return caches.match('status-offline.html');
        })
    );
    return;
  }

  // ───────────── STATIC FILES ─────────────
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;

      return fetch(event.request)
        .then(function (response) {
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

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
    })
  );
});

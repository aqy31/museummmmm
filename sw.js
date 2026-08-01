const CACHE_NAME = 'museum-vr-v6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './winged_bulls.html',
  './tutunji_house_iwan.html',
  './al_nuri_crypt.html',
  './style.css',
  './logo.png',
  './winged_bulls.png',
  './tutunji_house_iwan.png',
  './al_nuri_crypt.png',
  './DeviceOrientationControls.js',
  './manifest.json'
  // Removed GLB files from precache so the UI caches instantly.
  // GLB files will be dynamically cached when the user opens them.
];

// Install Event - Precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline pages');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache First Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      // 1. Return cached version if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Otherwise fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Cache EVERYTHING (basic, cors, and opaque) to ensure offline works for CDN files (like Three.js, Fonts, etc.)
        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
            return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        // 3. If offline and resource is not in cache (e.g. they typed a random URL), fallback to index
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

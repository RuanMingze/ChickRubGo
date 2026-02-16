const CACHE_NAME = 'chickrubgo-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './renderer.js',
  './Run-Server.js',
  './test-html.js',
  './validate.js',
  './manifest.json',
  './favicon-2.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css',
  'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js',
  'https://cdnjs.cloudflare.com/ajax/libs/ffmpeg/0.12.15/umd/ffmpeg.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
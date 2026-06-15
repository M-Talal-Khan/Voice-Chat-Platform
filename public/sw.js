const CACHE_NAME = 'thiscord-cache-v1';
const urlsToCache = [
  '/',
  '/auth/login',
  '/auth/register',
  '/logo-icon.svg',
  '/logo-with-text.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request);
      })
  );
});

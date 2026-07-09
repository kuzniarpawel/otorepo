/* OTOREPO — service worker (PWA offline).
   Aplikacja to jeden samowystarczalny plik (otorepo.html z wklejonymi czcionkami),
   więc cache'ujemy powłokę i serwujemy cache-first → działa bez internetu.
   AKTUALIZACJA: po zmianie otorepo.html podbij numer CACHE (np. v2), aby wymusić odświeżenie. */
const CACHE = 'otorepo-v7';
const ASSETS = [
  'otorepo.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).catch(() => caches.match('otorepo.html'))
    )
  );
});

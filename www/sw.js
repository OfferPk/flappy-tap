/* Offline-first service worker — Urr Jaa! v3.58.5-urrjaa */
const CACHE = 'urrjaa-v95-20260930';
const ASSETS = [
  './',
  './index.html',
  './how-to-play.html',
  './css/style.css',
  './js/sim.js',
  './js/storage.js',
  './js/audio.js',
  './js/ads.js',
  './js/skins.js',
  './js/game.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/characters/manifest.json',
  './assets/characters/sunseed.webp',
  './assets/characters/moonwink.webp',
  './assets/characters/riverflash.webp',
  './assets/characters/cinderwing.webp',
  './assets/characters/ticktock.webp',
  './assets/characters/zipzap.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.indexOf('urrjaa-v') === 0 && key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const response = await fetch(req);
      if (response.ok && new URL(req.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
      }
      return response;
    } catch (error) {
      if (req.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      throw error;
    }
  })());
});

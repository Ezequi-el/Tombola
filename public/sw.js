// Filled by scripts/build-pwa.mjs after Vite has emitted every asset.
const CACHE = 'tombola-pwa-__BUILD_REVISION__';
const CORE = [] /* __PRECACHE__ */;

self.addEventListener('install', (event) => {
  // Installation succeeds only if the complete app (including fonts) is cached.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    CORE.map(url => new Request(url, { cache: 'reload' }))
  )));
  // Updates wait until existing windows close, keeping HTML and assets together.
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key =>
      key !== CACHE && (key.startsWith('tombola-pwa-') || key === 'tombola-v1')
    ).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Never cache API responses or unrelated resources as app assets.
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache =>
      (await cache.match('/index.html')) || fetch(request)
    ));
  } else if (CORE.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(async cache =>
      (await cache.match(url.pathname)) || fetch(request)
    ));
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'TOMBOLA_OFFLINE_STATUS') {
    event.source?.postMessage({ type: 'TOMBOLA_OFFLINE_READY' });
  }
});

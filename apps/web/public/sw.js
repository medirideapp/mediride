self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-first for API; cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/backend') || url.pathname.includes('socket.io')) {
    return;
  }
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open('nemt-static-v1').then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const res = await fetch(event.request);
        if (res.ok && url.origin === self.location.origin) {
          cache.put(event.request, res.clone());
        }
        return res;
      } catch {
        return cached || Response.error();
      }
    }),
  );
});

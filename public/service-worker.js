const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `nexora-static-${CACHE_VERSION}`;
const API_CACHE = `nexora-api-${CACHE_VERSION}`;
const NAVIGATION_CACHE = `nexora-nav-${CACHE_VERSION}`;
const OFFLINE_URL = '/index.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/LogoRohamaab.png',
  '/LogoRohamaab.png',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const allowedCaches = [STATIC_CACHE, API_CACHE, NAVIGATION_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => !allowedCaches.includes(name))
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isApiRequest = isSameOrigin && url.pathname.startsWith('/api/');
  const isNavigation = event.request.mode === 'navigate';

  if (isApiRequest) {
    event.respondWith(networkFirstWithCache(event.request, API_CACHE));
  } else if (isNavigation) {
    event.respondWith(networkFirstWithOffline(event.request));
  } else if (isSameOrigin) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('', { status: 408, statusText: 'Request Timeout' });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(NAVIGATION_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_URL);
  }
}

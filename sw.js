// 一键 Get Service Worker
const CACHE_NAME = 'yijian-get-v1';
const OFFLINE_URL = '/index.html';

// 预缓存核心资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/tailwind.min.js',
  '/js/lucide.min.js',
  '/js/store.js',
  '/js/app.js',
  '/js/seed-data.js',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只缓存 GET 请求
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API 请求走网络，不缓存
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ ok: false, msg: '网络异常' }), {
        headers: { 'Content-Type': 'application/json' },
      }))
    );
    return;
  }

  // 静态资源：缓存优先，网络更新
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// ============================================================
// DietPro — Service Worker v1
// Cache + Notificaciones push
// ============================================================

const CACHE = 'dietpro-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/store.js',
  '/src/auth.js',
  '/src/scanner.js',
  '/src/notifications.js',
  '/src/main.js',
  '/src/views/dashboard.js',
  '/src/views/products.js',
  '/src/views/sales.js',
  '/src/views/offers.js',
  '/src/views/settings.js',
  '/src/views/public-page.js',
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate — limpia caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — Network first, fallback cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Supabase y CDN: siempre network
  if (url.hostname.includes('supabase') || url.hostname.includes('cdn')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notification recibida
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  const options = {
    body: data.message || 'Nueva notificación de DietPro',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.type || 'dietpro',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
  };
  e.waitUntil(self.registration.showNotification(data.title || 'DietPro', options));
});

// Click en notificación push
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(clients.openWindow(url));
});

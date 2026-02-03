// frontend/public/sw.js

const CACHE_NAME = 'entropy-engine-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
    // Add other assets if you have images
];

// 1. INSTALL: Cache the skeletal UI
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing Defense Systems...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. ACTIVATE: Cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated.');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

// 3. FETCH: Intercept network requests
self.addEventListener('fetch', (event) => {
    // If the network is dead, serve from Cache
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        }).catch(() => {
            // Fallback for when both Network and Cache fail (The Bunker)
            return caches.match('/');
        })
    );
});
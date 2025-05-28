// service-worker.js

const CACHE_NAME = 'kegel-timer-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/app.js',
    '/style.css',
    '/manifest.json',
    // Placeholder icons (replace with your actual icon paths if you download them)
    'https://placehold.co/48x48/4F46E5/ffffff?text=K',
    'https://placehold.co/72x72/4F46E5/ffffff?text=K',
    'https://placehold.co/96x96/4F46E5/ffffff?text=K',
    'https://placehold.co/144x144/4F46E5/ffffff?text=K',
    'https://placehold.co/192x192/4F46E5/ffffff?text=K',
    'https://placehold.co/256x256/4F46E5/ffffff?text=K',
    'https://placehold.co/384x384/4F46E5/ffffff?text=K',
    'https://placehold.co/512x512/4F46E5/ffffff?text=K'
];

// Install event: caches essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Failed to cache during install:', error);
            })
    );
});

// Activate event: cleans up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event: serves content from cache or network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // No cache hit - fetch from network
                return fetch(event.request).then(
                    (response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        // IMPORTANT: Clone the response. A response is a stream
                        // and can only be consumed once. We must clone it so that
                        // the browser can consume one and we can consume the other.
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                );
            })
            .catch(error => {
                console.error('Fetch failed:', error);
                // You could return a custom offline page here
                // For example: return caches.match('/offline.html');
            })
    );
});

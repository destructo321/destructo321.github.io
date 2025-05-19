const CACHE_NAME = 'scratchpad-cache-v1'; // Increment cache version if you make changes to cached assets
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    // Add paths to your icons here (ensure these paths are correct)
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    // Add the Google Fonts URLs for offline access
    'https://fonts.googleapis.com/css2?family=Oi&family=Press+Start+2P&family=Roboto+Flex:opsz,wght@8..144,100;8..144,800&family=Roboto+Mono:wght@500&family=VT323&display=swap',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    // The actual font files linked from Google Fonts CSS will also be cached
    // by the service worker when they are fetched by the browser.
    // However, explicitly caching the CSS file ensures the initial request works offline.
];

// Install event: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                // Add all the specified URLs to the cache
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Failed to open cache or add URLs:', err);
            })
    );
});

// Fetch event: serve from cache first, then network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // No cache hit - fetch from network
                // Clone the request because it's a stream and can only be consumed once
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    (response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response because it's a stream and can only be consumed once
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
            .catch(err => {
                console.error('Fetch failed:', err);
                // Optional: Provide a fallback response for offline
                // return caches.match('/offline.html'); // If you have an offline page
            })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache version
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Delete old caches that are not in the whitelist
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

const CACHE_NAME = 'fairtab-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/avatar-placeholder.svg',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/globals.css',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/app-client.js',
  '/_next/static/css/app.css',
  '/images/avatar-placeholder.svg',
  // Add routes for page components
  '/groups',
  '/groups/new',
  '/friends',
  '/activity',
  '/settings',
  '/expenses',
  '/expenses/new',
  '/settle'
];

// Install event - cache the essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell and content');
        return Promise.all(
          ASSETS_TO_CACHE.map(url => {
            return fetch(url)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`Failed to cache ${url}: ${response.status} ${response.statusText}`);
                }
                return cache.put(url, response);
              })
              .catch(error => {
                console.warn(`[Service Worker] Caching failed for ${url}:`, error.message);
                // Don't let individual asset failures break the entire cache process
                return Promise.resolve();
              });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Install completed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Install failed:', error);
        // Continue even if caching failed
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[Service Worker] Clearing old cache', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      console.log('[Service Worker] Now ready to handle fetches!');
      return self.clients.claim();
    })
  );
});

// Helper function to determine if a request is for a route in our SPA
function isSPARoute(pathname) {
  return pathname === '/' || 
         pathname.startsWith('/groups') || 
         pathname.startsWith('/friends') || 
         pathname.startsWith('/activity') || 
         pathname.startsWith('/settings') || 
         pathname.startsWith('/expenses') ||
         pathname.startsWith('/settle');
}

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Log fetch attempts for debugging
  console.log(`[Service Worker] Fetch: ${url.pathname} (${event.request.destination})`);
  
  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // For navigation requests or SPA routes, use a special strategy that always serves index.html
  // This ensures React Router can take over client-side routing
  if (event.request.mode === 'navigate' || isSPARoute(url.pathname)) {
    event.respondWith(
      caches.match('/').then(cachedIndex => {
        if (cachedIndex) {
          // Always return the index.html for navigation requests
          // This lets React Router handle the routing client-side
          console.log(`[Service Worker] Serving index.html for SPA route: ${url.pathname}`);
          
          // Try to fetch and update the cache in the background
          fetch(event.request)
            .then(response => {
              if (response.ok) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put('/', response.clone());
                });
              }
            })
            .catch(error => {
              console.log('[Service Worker] Background fetch failed:', error);
            });
            
          return cachedIndex;
        }
        
        // If index.html is not in cache, try to fetch it
        return fetch(event.request)
          .catch(() => {
            console.log('[Service Worker] Fetch failed for navigation, returning offline page');
            // Here you could return a specific offline page if you have one
            return new Response('You are offline. Please try again when you have an internet connection.', {
              headers: { 'Content-Type': 'text/html' }
            });
          });
      })
    );
    return;
  }

  // For static assets, use Cache First strategy
  if (
    event.request.destination === 'style' || 
    event.request.destination === 'script' || 
    event.request.destination === 'image' || 
    event.request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached response and update cache in background
            fetch(event.request)
              .then(response => {
                if (response && response.status === 200) {
                  caches.open(CACHE_NAME)
                    .then(cache => {
                      cache.put(event.request, response);
                    });
                }
              })
              .catch(() => {/* Ignore errors when updating cache */});
            
            return cachedResponse;
          }

          // If not in cache, fetch from network
          return fetch(event.request)
            .then((response) => {
              // Only cache valid responses
              if (!response || response.status !== 200) {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch((error) => {
              console.error(`[Service Worker] Fetch failed for ${url.pathname}:`, error);
              // For images, return a placeholder
              if (event.request.destination === 'image') {
                return caches.match('/avatar-placeholder.svg');
              }
              throw error;
            });
        })
    );
    return;
  }

  // For API requests or anything else, use a Network First strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        
        return response;
      })
      .catch(() => {
        console.log(`[Service Worker] Falling back to cache for: ${url.pathname}`);
        return caches.match(event.request);
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting commanded');
    self.skipWaiting();
  }
});


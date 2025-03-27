const CACHE_NAME = 'fairtab-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/avatar-placeholder.svg',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/globals.css',
  '/images/avatar-placeholder.svg',
  // Add routes for page components
  '/groups',
  '/groups/new',
  '/friends',
  '/activity',
  '/settings',
  '/expenses',
  '/expenses/new',
  '/settle',
];

// Install event - cache the essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE).catch(() => {
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => self.clients.claim())
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

// Helper function to create a basic HTML response for offline mode
function createOfflineFallbackResponse() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FairTab - Offline Mode</title>
        <style>
          body {
            font-family: sans-serif;
            padding: 20px;
            text-align: center;
            max-width: 500px;
            margin: 0 auto;
          }
          .offline-message {
            margin-top: 50px;
            padding: 20px;
            border: 1px solid #eee;
            border-radius: 10px;
            background-color: #f9f9f9;
          }
          h1 { color: #333; }
          p { color: #666; line-height: 1.5; }
          .spinner {
            margin: 20px auto;
            width: 50px;
            height: 50px;
            border: 3px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: #333;
            animation: spin 1s ease-in-out infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .retry-button {
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="offline-message">
          <h1>You're Offline</h1>
          <p>Internet connection not available. FairTab is trying to load from the cache.</p>
          <div class="spinner"></div>
          <p>If the app doesn't load in a few seconds, please check your connection and try again.</p>
          <button class="retry-button" onclick="window.location.reload()">Retry</button>
        </div>
        <script>
          // Check if we have a cached version of the app
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        </script>
      </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  });
}

// Aggressively cache resources on first load
function cacheResourcesOnFirstLoad() {
  // This function will cache key resources needed for the app
  // to work offline, focusing on the app shell and main content
  return caches.open(CACHE_NAME).then(cache => {
    return cache.addAll(ASSETS_TO_CACHE);
  });
}

// When the service worker is first activated, cache important resources
self.addEventListener('activate', event => {
  event.waitUntil(cacheResourcesOnFirstLoad());
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // For navigation requests (page loads) and SPA routes
  if (event.request.mode === 'navigate' || isSPARoute(url.pathname)) {
    event.respondWith(
      // Try network first for navigation requests to get fresh content
      fetch(event.request)
        .then(response => {
          // If we got a valid response, clone it and cache it
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          if (isSPARoute(url.pathname)) {
            return caches.match('/').then(rootResponse => {
              if (rootResponse) return rootResponse;
            })
          }

          return caches.match(event.request)
            .then(cachedResponse => {
              // If we have a cached response, return it
              if (cachedResponse) return cachedResponse;
              return createOfflineFallbackResponse();
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
        return caches.match(event.request);
      })
  );
});


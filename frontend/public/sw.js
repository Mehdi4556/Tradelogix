// Service Worker for TradeLogix
const CACHE_NAME = 'tradelogix-v1';
const API_CACHE_NAME = 'tradelogix-api-v1';

// Assets to cache
const urlsToCache = [
  '/',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/contexts/AuthContext.jsx',
  '/src/components/Navigation.jsx',
  '/src/pages/Dashboard.jsx',
  '/src/pages/Login.jsx',
  '/src/pages/Signup.jsx',
  '/manifest.json'
];

// API endpoints to cache
const apiEndpoints = [
  '/api/auth/me',
  '/api/trades',
  '/api/reports/analytics'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(cache => {
        return fetch(request).then(response => {
          // Only cache successful GET requests
          if (request.method === 'GET' && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          // Return cached version if network fails
          return cache.match(request);
        });
      })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then(response => {
      // Return cached version if available
      if (response) {
        return response;
      }

      // Network first for dynamic content
      return fetch(request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache successful responses
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline page if available
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Service Worker: Background sync triggered');
  
  // Example: Sync offline trades
  const offlineActions = await getOfflineActions();
  for (const action of offlineActions) {
    try {
      await syncAction(action);
    } catch (error) {
      console.error('Failed to sync action:', error);
    }
  }
}

// Push notification handler
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data,
      actions: data.actions
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Helper functions
async function getOfflineActions() {
  // Retrieve offline actions from IndexedDB
  return [];
}

async function syncAction(action) {
  // Sync individual action with server
  return fetch(action.url, {
    method: action.method,
    headers: action.headers,
    body: action.body
  });
} 
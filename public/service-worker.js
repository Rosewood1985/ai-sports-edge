const CACHE_NAME = 'ai-sports-edge-cache-v1';
const RUNTIME_CACHE = 'ai-sports-edge-runtime-cache';

// Resources to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/neon-ui.css',
  '/images/ai_logo.webp',
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/v1/sports',
  '/api/v1/leagues',
  '/api/v1/teams',
];

// Install event - precache static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service worker pre-caching resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine if a request is an API request
const isApiRequest = (url) => {
  return url.pathname.startsWith('/api/');
};

// Helper function to determine if a request is a navigation request
const isNavigationRequest = (request) => {
  return request.mode === 'navigate';
};

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
};

// Fetch event - handle requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Cache strategy for API requests
  if (isApiRequest(url)) {
    // Network first, then cache for API requests
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response if it's valid
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache strategy for navigation requests
  if (isNavigationRequest(event.request)) {
    // Network first, then cache for navigation requests
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response if it's valid
          if (response.status === 200) {
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
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, serve the index.html as fallback
              return caches.match('/index.html');
            });
        })
    );
    return;
  }
  
  // Cache strategy for static assets
  if (isStaticAsset(url)) {
    // Cache first, then network for static assets
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, fetch from network and cache
          return fetch(event.request)
            .then(response => {
              // Cache the response if it's valid
              if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return response;
            });
        })
    );
    return;
  }
  
  // Default strategy for other requests
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-user-actions') {
    event.waitUntil(syncUserActions());
  }
});

// Function to sync user actions when back online
async function syncUserActions() {
  try {
    // Get all pending actions from IndexedDB
    const db = await openDatabase();
    const pendingActions = await getPendingActions(db);
    
    // Process each pending action
    for (const action of pendingActions) {
      try {
        // Send the action to the server
        const response = await fetch('/api/v1/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action),
        });
        
        if (response.ok) {
          // If successful, mark the action as synced
          await markActionAsSynced(db, action.id);
        }
      } catch (error) {
        console.error('Error syncing action:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncUserActions:', error);
  }
}

// Helper function to open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ai-sports-edge-db', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      reject(event.target.error);
    };
  });
}

// Helper function to get pending actions from IndexedDB
function getPendingActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');
    const request = store.getAll();
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      reject(event.target.error);
    };
  });
}

// Helper function to mark an action as synced in IndexedDB
function markActionAsSynced(db, actionId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    const request = store.delete(actionId);
    
    request.onsuccess = event => {
      resolve();
    };
    
    request.onerror = event => {
      reject(event.target.error);
    };
  });
}

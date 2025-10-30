const CACHE_NAME = 'mazaochain-v2';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/logo.svg',
  '/favicon.ico',
  // Add other static assets as needed
];

// Essential pages that should work offline
const ESSENTIAL_PAGES = [
  '/fr/dashboard/farmer',
  '/fr/dashboard/cooperative',
  '/fr/dashboard/lender',
  '/ln/dashboard/farmer',
  '/ln/dashboard/cooperative',
  '/ln/dashboard/lender',
];

const DYNAMIC_CACHE_URLS = [
  // API endpoints that should be cached
  '/api/auth/user',
  '/api/profile',
  '/api/crop-evaluations',
  '/api/loans',
  '/api/metrics',
];

// Install event - cache static assets and essential pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        // Cache static assets first
        return cache.addAll(STATIC_CACHE_URLS)
          .then(() => {
            // Try to cache essential pages, but don't fail if they're not available
            console.log('Attempting to cache essential pages');
            return Promise.allSettled(
              ESSENTIAL_PAGES.map(url => 
                cache.add(url).catch(err => {
                  console.warn(`Failed to cache ${url}:`, err);
                })
              )
            );
          });
      })
      .then(() => {
        console.log('Service worker installation complete');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Claim all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // Always let the browser handle navigations (avoids redirect-mode issues with middleware)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { redirect: 'follow', cache: 'no-store' })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok && DYNAMIC_CACHE_URLS.some(path => url.pathname.startsWith(path))) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(request);
        })
    );
    return;
  }

  // Handle page requests
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request, { redirect: 'follow' })
          .then((response) => {
            // Don't cache non-successful responses
            if (!response.ok) {
              return response;
            }

            // Cache the response
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(
      syncOfflineData()
        .then(() => {
          console.log('Background sync completed successfully');
          // Notify all clients that sync is complete
          return self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_COMPLETE',
                timestamp: Date.now()
              });
            });
          });
        })
        .catch(error => {
          console.error('Background sync failed:', error);
        })
    );
  }
});

// Function to sync offline data
async function syncOfflineData() {
  // Open IndexedDB and get unsynced data
  const db = await openOfflineDB();
  const unsyncedData = await getUnsyncedData(db);
  
  console.log(`Syncing ${unsyncedData.length} offline items`);
  
  for (const item of unsyncedData) {
    try {
      // Determine the API endpoint based on item type
      let endpoint = '';
      switch (item.type) {
        case 'evaluation':
          endpoint = '/api/crop-evaluations';
          break;
        case 'loan_request':
          endpoint = '/api/loans';
          break;
        case 'profile_update':
          endpoint = '/api/profile';
          break;
        default:
          console.warn(`Unknown item type: ${item.type}`);
          continue;
      }
      
      // Attempt to sync the data
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.data)
      });
      
      if (response.ok) {
        // Mark as synced in IndexedDB
        await markAsSynced(db, item.id);
        console.log(`Successfully synced item: ${item.id}`);
      } else {
        console.error(`Failed to sync item ${item.id}: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error syncing item ${item.id}:`, error);
    }
  }
  
  // Clean up synced data
  await clearSyncedData(db);
}

// Helper functions for IndexedDB operations
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mazaochain-offline', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getUnsyncedData(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_data'], 'readonly');
    const store = transaction.objectStore('offline_data');
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function markAsSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_data'], 'readwrite');
    const store = transaction.objectStore('offline_data');
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const data = getRequest.result;
      if (data) {
        data.synced = true;
        const putRequest = store.put(data);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

function clearSyncedData(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline_data'], 'readwrite');
    const store = transaction.objectStore('offline_data');
    const index = store.index('synced');
    const request = index.openCursor(IDBKeyRange.only(true));
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_OFFLINE_DATA') {
    // Trigger background sync
    if (self.registration.sync) {
      self.registration.sync.register('sync-offline-data')
        .then(() => console.log('Background sync registered'))
        .catch(err => console.error('Background sync registration failed:', err));
    } else {
      // Fallback: sync immediately if background sync is not supported
      syncOfflineData()
        .then(() => {
          event.ports[0]?.postMessage({ success: true });
        })
        .catch(error => {
          event.ports[0]?.postMessage({ success: false, error: error.message });
        });
    }
  }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      data: data.data || {},
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
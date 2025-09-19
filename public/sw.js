const CACHE_NAME = 'soccer-squad-v3.1.0';
const CACHE_VERSION = '3.1.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/src/index.css',
  '/src/main.tsx',
  '/src/App.tsx',
  // Adicione outros recursos críticos aqui
];

// Track update availability
let updateAvailable = false;
let newCacheName = null;

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log(`Installing new service worker version: ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Check if this is an update
        return caches.keys();
      })
      .then((cacheNames) => {
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('soccer-squad-') && name !== CACHE_NAME
        );
        
        if (oldCaches.length > 0) {
          console.log('Update detected, old caches found:', oldCaches);
          updateAvailable = true;
          newCacheName = CACHE_NAME;
          
          // Notify main thread about update
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'UPDATE_AVAILABLE',
                version: CACHE_VERSION,
                updateInfo: {
                  version: CACHE_VERSION,
                  features: [
                    'Sistema de notificações de atualização',
                    'Indicador de versão melhorado',
                    'Gerenciamento inteligente de cache'
                  ],
                  fixes: [
                    'Correção de problemas de cache',
                    'Melhoria na detecção de atualizações'
                  ],
                  critical: false
                }
              });
            });
          });
        }
      })
      .catch((error) => {
        console.error('Failed to cache resources during install:', error);
      })
  );
  
  // Skip waiting to activate immediately if it's a critical update
  self.skipWaiting();
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // If both cache and network fail, show offline page
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Activate
self.addEventListener('activate', (event) => {
  console.log(`Activating service worker version: ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const oldCaches = cacheNames.filter(cacheName => 
        cacheName.startsWith('soccer-squad-') && cacheName !== CACHE_NAME
      );
      
      if (oldCaches.length > 0) {
        console.log('Cleaning up old caches:', oldCaches);
      }
      
      return Promise.all(
        oldCaches.map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Notify clients that update is complete
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_COMPLETE',
          version: CACHE_VERSION
        });
      });
    })
  );
  
  self.clients.claim();
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CHECK_VERSION') {
    // Send current version info
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      cacheName: CACHE_NAME,
      updateAvailable: updateAvailable
    });
  } else if (event.data && event.data.type === 'APPLY_UPDATE') {
    // Force update by skipping waiting
    self.skipWaiting();
    
    // Notify about update progress
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_PROGRESS',
          status: 'applying'
        });
      });
    });
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Implementar sincronização de dados quando voltar online
  }
});

// Push notifications (futuro)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});
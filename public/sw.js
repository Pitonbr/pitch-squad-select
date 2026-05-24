const CACHE_NAME = 'soccer-squad-v3.2.0';
const CACHE_VERSION = '3.2.0';

// Apenas recursos que existem de fato no build de produção.
// Assets JS/CSS têm hashes no nome e são cacheados dinamicamente pelo fetch handler.
const urlsToCache = [
  '/',
  '/manifest.json',
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

// Fetch — estratégias por tipo de recurso
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar requisições não-HTTP e extensões do browser
  if (!event.request.url.startsWith('http')) return;

  // Ignorar chamadas à API do Supabase (sempre network)
  if (url.hostname.includes('supabase.co')) return;

  const isAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$/);
  const isHashedAsset = isAsset && url.pathname.match(/[a-f0-9]{8}/);

  if (isHashedAsset) {
    // Cache-first: assets com hash nunca mudam — servir do cache indefinidamente
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  } else if (event.request.mode === 'navigate') {
    // Network-first para navegação: garante HTML sempre atualizado, fallback offline
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
  } else {
    // Stale-while-revalidate para demais recursos estáticos
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => null);
        return cached || networkFetch;
      })
    );
  }
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

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Soccer Squad',
    body: 'Nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {}
      };
    } catch (e) {
      console.error('Error parsing push notification data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      tag: notificationData.data.tag || 'default',
      requireInteraction: false,
      actions: notificationData.data.actions || []
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
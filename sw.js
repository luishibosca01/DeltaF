// CAMBIA ESTO CADA VEZ QUE ACTUALICES TU CÓDIGO
const CACHE_NAME = 'DeltaF-v1.0.0'; 

const urlsToCache = [
  './',                // Esto es importante para GitHub Pages (el root del repo)
  './index.html',      // Asegúrate de que tu archivo se llame así
  './manifest.json',   // Asegúrate de subir este archivo
  './icon.svg'         // OJO: Si usas el SVG que hicimos, ponlo aquí.
                       // Si usas PNGs en carpeta, pon './icons/icon-192.png' etc.
];

// Instalación
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta');
        // El 'return' aquí es vital. Si un archivo falla, todo falla.
        return cache.addAll(urlsToCache); 
      })
  );
  self.skipWaiting(); // Fuerza al SW a activarse inmediatamente
});

// Activación (Limpieza de cachés viejas)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Toma control de la página inmediatamente
});

// Fetch (Estrategia: Cache First, Network Fallback)
self.addEventListener('fetch', event => {
  // Ignorar peticiones que no sean GET o que sean a otros dominios (Analytics, etc)
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 1. Si está en caché, devuélvelo
        if (response) {
          return response;
        }

        // 2. Si no, búscalo en la red
        return fetch(event.request).then(networkResponse => {
            // Verificar respuesta válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clonar respuesta para guardarla en caché
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });

            return networkResponse;
          })
          .catch(() => {
            // 3. Si no hay red y no estaba en caché (Modo Offline total)
            // Si la petición era para navegar (abrir la app), devuelve el index
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

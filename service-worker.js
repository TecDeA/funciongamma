/* Service Worker de la PWA Función Gamma.
   El scope se limita a la carpeta donde se aloje este archivo,
   por lo que no interfiere con el resto del portal en el que esté instalado. */

const VERSION = '1.1.0';
const CACHE_NAME = `funcion-gamma-v${VERSION}`;

/* Solo recursos locales de la app; los CDN se dejan a la red */
const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './img/icon-192.png',
    './img/icon-512.png',
    './img/icon-maskable-512.png',
    './img/apple-touch-icon.png',
    './img/favicon.ico',
    './img/favicon-16.png',
    './img/favicon-32.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

/* Network-first: si hay red servimos lo último; sin red caemos al caché */
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok && event.request.url.startsWith(self.location.origin)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request, { ignoreSearch: true })
                .then((cached) => cached || caches.match('./index.html')))
    );
});

/* Responde con la versión para el chip del banner */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GET_VERSION') {
        event.source.postMessage({ type: 'VERSION', version: VERSION });
    }
});

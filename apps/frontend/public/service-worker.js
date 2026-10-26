/* Only immutable assets and the explicit offline page are cached. Wallet/API data stays on the network. */
const CACHE = 'xartists-public-v11'
const base = new URL('./', self.location.href)
const offline = new URL('offline.html', base).href
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([offline, new URL('manifest.webmanifest', base).href])))
})
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('xartists-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()))
})
self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match(offline)) || new Response('Offline', { status: 503 })))
    return
  }
  if (url.pathname.startsWith(base.pathname + 'assets/') && !url.search && ['script', 'style', 'font', 'image'].includes(request.destination)) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone()
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)))
      }
      return response
    }).catch(async () => (await caches.match(request)) || Response.error()))
  }
})

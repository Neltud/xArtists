/* xArtists PWA — v8: packs open theater + pulse museum + texture proxy */
const SHELL = 'xartists-shell-v8'
const DATA = 'xartists-data-v8'
const PRECACHE = ['/xArtists/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL, DATA])
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return
  if (url.origin !== self.location.origin) return
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.includes('/assets/')) {
    event.respondWith(
      fetch(event.request).then((r) => {
        const copy = r.clone()
        caches.open(SHELL).then((c) => c.put(event.request, copy))
        return r
      }).catch(() => caches.match(event.request))
    )
    return
  }
  event.respondWith(
    caches.open(DATA).then((cache) =>
      cache.match(event.request).then((hit) => hit || fetch(event.request).then((r) => {
        cache.put(event.request, r.clone())
        return r
      }))
    )
  )
})

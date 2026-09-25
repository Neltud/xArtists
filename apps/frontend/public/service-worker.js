/* xArtists PWA — v9: network-first HTML/JS/CSS, purge shell-v8 */
const SHELL = 'xartists-shell-v9'
const DATA = 'xartists-data-v9'
const PRECACHE = ['/xArtists/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL, DATA])
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  const path = url.pathname
  const isShell =
    path.endsWith('.html') ||
    path.endsWith('/') ||
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.includes('/assets/')

  // Network-first for app shell — avoid serving stale hashed bundles
  if (isShell) {
    event.respondWith(
      fetch(req)
        .then((r) => {
          if (r && r.ok) {
            const copy = r.clone()
            caches.open(SHELL).then((c) => c.put(req, copy)).catch(() => undefined)
          }
          return r
        })
        .catch(() => caches.match(req))
    )
    return
  }

  event.respondWith(
    caches.open(DATA).then((cache) =>
      cache.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((r) => {
            if (r && r.ok) cache.put(req, r.clone()).catch(() => undefined)
            return r
          })
      )
    )
  )
})

/* xArtists PWA — shell cache + stale-while-revalidate for data JSON */
const SHELL = 'xartists-shell-v3'
const DATA = 'xartists-data-v3'
const PRECACHE = [
  '/xArtists/',
  '/xArtists/index.html',
  '/xArtists/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL, DATA])
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

function isDataPath(url) {
  return url.pathname.includes('/xArtists/data/') || url.pathname.includes('/data/')
}

function isApi(url) {
  return (
    url.hostname.includes('multiversx.com') ||
    url.hostname.includes('coingecko.com') ||
    url.hostname.includes('api.')
  )
}

function isAsset(url) {
  return /\.(js|css|woff2?|svg|png|webp|ico)$/i.test(url.pathname)
}

/** Network-first, cache fallback (fresh data preferred) */
function networkFirst(request, cacheName) {
  return fetch(request)
    .then((res) => {
      if (res && res.ok) {
        const copy = res.clone()
        caches.open(cacheName).then((c) => c.put(request, copy))
      }
      return res
    })
    .catch(() => caches.match(request))
}

/** Cache-first for static build assets */
function cacheFirst(request, cacheName) {
  return caches.match(request).then((cached) => {
    if (cached) {
      // Background refresh
      fetch(request)
        .then((res) => {
          if (res && res.ok) caches.open(cacheName).then((c) => c.put(request, res))
        })
        .catch(() => {})
      return cached
    }
    return fetch(request).then((res) => {
      if (res && res.ok) {
        const copy = res.clone()
        caches.open(cacheName).then((c) => c.put(request, copy))
      }
      return res
    })
  })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Never hijack browser navigations to external wallets
  if (request.mode === 'navigate' && !url.pathname.startsWith('/xArtists')) return

  if (isDataPath(url) || isApi(url)) {
    event.respondWith(networkFirst(request, DATA))
    return
  }

  if (isAsset(url) || url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL))
  }
})

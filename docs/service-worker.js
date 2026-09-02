/* xArtists PWA — v4: never serve stale index/404; network-first HTML */
const SHELL = 'xartists-shell-v4'
const DATA = 'xartists-data-v4'
const PRECACHE = [
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

function isHtmlNav(request, url) {
  if (request.mode === 'navigate') return true
  if (url.pathname.endsWith('.html')) return true
  if (url.pathname === '/xArtists' || url.pathname === '/xArtists/') return true
  if (url.pathname.startsWith('/xArtists/') && !isAsset(url) && !isDataPath(url)) return true
  return false
}

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

function cacheFirst(request, cacheName) {
  return caches.match(request).then((cached) => {
    if (cached) {
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
  if (url.origin !== self.location.origin) {
    if (isApi(url)) {
      event.respondWith(networkFirst(request, DATA))
    }
    return
  }
  if (isHtmlNav(request, url)) {
    event.respondWith(
      fetch(request)
        .then((res) => res)
        .catch(() => caches.match('/xArtists/index.html'))
    )
    return
  }
  if (isDataPath(url)) {
    event.respondWith(networkFirst(request, DATA))
    return
  }
  if (isAsset(url)) {
    event.respondWith(cacheFirst(request, SHELL))
    return
  }
})

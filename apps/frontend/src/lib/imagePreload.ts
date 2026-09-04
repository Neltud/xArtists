/**
 * File de préchargement textures (salle 3D / futur WebGL).
 * Concurrence limitée · priorité near · decode async · cache global.
 */

const seen = new Set<string>()
const cache = new Map<string, HTMLImageElement>()
const queue: { url: string; priority: number }[] = []
let active = 0
const MAX_CONCURRENT = 4

function pump() {
  while (active < MAX_CONCURRENT && queue.length) {
    // highest priority first
    queue.sort((a, b) => b.priority - a.priority)
    const next = queue.shift()
    if (!next) break
    if (cache.has(next.url) || seen.has(next.url + ':loading')) continue
    seen.add(next.url + ':loading')
    active += 1
    const img = new Image()
    img.decoding = 'async'
    // @ts-expect-error fetchPriority is widely supported
    img.fetchPriority = next.priority >= 8 ? 'high' : 'low'
    img.onload = () => {
      cache.set(next.url, img)
      active -= 1
      pump()
    }
    img.onerror = () => {
      active -= 1
      pump()
    }
    img.src = next.url
  }
}

/** Précharge une liste (priority 0–10). Ne flood pas le réseau. */
export function preloadImages(
  urls: (string | undefined | null)[],
  limit = 6,
  basePriority = 5
): void {
  if (typeof window === 'undefined') return
  let n = 0
  for (const u of urls) {
    if (!u || !/^https?:\/\//i.test(u)) continue
    if (cache.has(u) || seen.has(u + ':loading')) continue
    if (queue.some(q => q.url === u)) continue
    queue.push({ url: u, priority: basePriority - n * 0.1 })
    n += 1
    if (n >= limit) break
  }
  pump()
}

/** Priorité haute pour l’œuvre la plus proche. */
export function preloadNear(url: string | undefined | null): void {
  if (!url || !/^https?:\/\//i.test(url)) return
  if (cache.has(url)) return
  const i = queue.findIndex(q => q.url === url)
  if (i >= 0) queue[i].priority = 10
  else queue.push({ url, priority: 10 })
  pump()
}

export function isImageCached(url: string): boolean {
  return cache.has(url)
}

export function preferThumbUrl(full?: string, thumb?: string): string | undefined {
  if (thumb && /^https?:\/\//i.test(thumb)) return thumb
  if (full && /^https?:\/\//i.test(full)) return full
  return undefined
}

/** Libère le cache si besoin (changement de musée). */
export function clearImageCache(): void {
  cache.clear()
  seen.clear()
  queue.length = 0
}

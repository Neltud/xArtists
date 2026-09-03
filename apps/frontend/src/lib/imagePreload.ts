/**
 * Précharge ciblée d’images (hall 3D) — pas de flood réseau.
 */
const seen = new Set<string>()

export function preloadImages(urls: (string | undefined | null)[], limit = 6): void {
  if (typeof window === 'undefined') return
  let n = 0
  for (const u of urls) {
    if (!u || !/^https?:\/\//i.test(u) || seen.has(u)) continue
    seen.add(u)
    const img = new Image()
    img.decoding = 'async'
    img.src = u
    n += 1
    if (n >= limit) break
  }
}

/** Réduit les URL trop lourdes quand un thumb existe déjà côté frame. */
export function preferThumbUrl(full?: string, thumb?: string): string | undefined {
  if (thumb && /^https?:\/\//i.test(thumb)) return thumb
  if (full && /^https?:\/\//i.test(full)) return full
  return undefined
}

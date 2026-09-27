/**
 * Charge le catalogue musée rafraîchi quotidiennement (GitHub Pages JSON).
 * Fallback silencieux si vide / offline.
 */
import type { FrameItem } from '../components/museum/MuseumCorridor'
import { proxyImg } from './museumWorldCatalog'

export type DailyCatalogWork = {
  id: string
  metId?: number
  title: string
  artist: string
  year?: string
  medium?: string
  dimensions?: string
  image: string
  imageFull?: string
  kind?: 'sculpture' | 'painting'
  license?: string
  department?: string
}

export type DailyCatalog = {
  generatedAt: string
  count: number
  works: DailyCatalogWork[]
}

const CACHE_KEY = 'xartists_daily_catalog_v1'

function dayKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function loadDailyMuseumCatalog(): Promise<DailyCatalog | null> {
  // session cache same day
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DailyCatalog & { _day?: string }
      if (parsed._day === dayKey() && parsed.works?.length) return parsed
    }
  } catch {
    /* */
  }

  const urls = [
    `${import.meta.env.BASE_URL}data/museum_catalog_daily.json`,
    '/xArtists/data/museum_catalog_daily.json',
  ]
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: 'no-cache' })
      if (!r.ok) continue
      const j = (await r.json()) as DailyCatalog
      if (!j?.works) continue
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...j, _day: dayKey() }))
      } catch {
        /* */
      }
      return j
    } catch {
      /* next */
    }
  }
  return null
}

export function dailyWorksToFrames(works: DailyCatalogWork[]): FrameItem[] {
  return works.map(w => ({
    id: w.id,
    title: w.title,
    subtitle: [w.artist, w.year].filter(Boolean).join(' · '),
    artist: w.artist,
    date: w.year,
    image: proxyImg(w.imageFull || w.image),
    kind: w.kind === 'sculpture' ? 'sculpture' : 'painting',
    medium: 'physical',
    technique: w.medium || (w.kind === 'sculpture' ? 'Sculpture' : 'Peinture'),
    dimensions: w.dimensions,
    license: w.license || 'Met Open Access / PD',
    collection: w.department || 'Met Open Access',
    description: `Catalogue quotidien · ${w.department || 'Met'} · ${w.license || 'PD'}`,
    onSale: true,
    priceLabel: 'Paper · intent BUY_NFT',
    href: w.metId
      ? `https://www.metmuseum.org/art/collection/search/${w.metId}`
      : undefined,
  }))
}

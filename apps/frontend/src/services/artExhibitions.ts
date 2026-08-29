/**
 * Art Tours — expositions mondiales (service culturel, ≠ pack IA).
 * Fetch local JSON + fallback GitHub raw · filtre par ville / dates.
 */

export type ArtExhibition = {
  id: string
  cityId: string
  title: string
  venue: string
  start: string
  end: string
  status: 'ongoing' | 'upcoming' | 'ended' | string
  url?: string
  tags?: string[]
}

export type ExhibitionFeed = {
  version?: string
  updated?: string
  exhibitions: ArtExhibition[]
}

const CACHE_KEY = 'xartists_art_exhibitions_v1'
const CACHE_TTL_MS = 15 * 60 * 1000

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** ongoing / upcoming relative to today */
export function liveStatus(expo: ArtExhibition, today = todayISO()): 'ongoing' | 'upcoming' | 'ended' {
  if (expo.end < today) return 'ended'
  if (expo.start > today) return 'upcoming'
  return 'ongoing'
}

export function filterByCity(
  list: ArtExhibition[],
  cityId: string,
  opts?: { includeEnded?: boolean }
): ArtExhibition[] {
  const today = todayISO()
  return list
    .filter(e => e.cityId === cityId)
    .filter(e => opts?.includeEnded || liveStatus(e, today) !== 'ended')
    .map(e => ({ ...e, status: liveStatus(e, today) }))
    .sort((a, b) => {
      const rank = (s: string) => (s === 'ongoing' ? 0 : s === 'upcoming' ? 1 : 2)
      return rank(a.status) - rank(b.status) || a.start.localeCompare(b.start)
    })
}

async function fetchJson(url: string): Promise<ExhibitionFeed | null> {
  try {
    const r = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
      cache: 'no-store',
    })
    if (!r.ok) return null
    const j = await r.json()
    if (!Array.isArray(j?.exhibitions)) return null
    return j as ExhibitionFeed
  } catch {
    return null
  }
}

/** Optional open museum sample (Met — CORS OK) for NYC enrichment */
async function enrichNycFromMet(): Promise<ArtExhibition[]> {
  try {
    const r = await fetch(
      'https://collectionapi.metmuseum.org/public/collection/v1/departments',
      { cache: 'force-cache' }
    )
    if (!r.ok) return []
    const j = await r.json()
    const n = Array.isArray(j?.departments) ? j.departments.length : 0
    if (!n) return []
    return [
      {
        id: 'met-api-live',
        cityId: 'nyc',
        title: `The Met · API live (${n} départements collection)`,
        venue: 'The Metropolitan Museum of Art',
        start: todayISO(),
        end: '2099-12-31',
        status: 'ongoing',
        url: 'https://www.metmuseum.org',
        tags: ['api-live', 'collection'],
      },
    ]
  } catch {
    return []
  }
}

export async function loadExhibitionFeed(force = false): Promise<ExhibitionFeed> {
  if (!force && typeof sessionStorage !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const { at, data } = JSON.parse(raw) as { at: number; data: ExhibitionFeed }
        if (Date.now() - at < CACHE_TTL_MS && data?.exhibitions?.length) return data
      }
    } catch {
      /* ignore */
    }
  }

  const base = typeof import.meta !== 'undefined' ? import.meta.env?.BASE_URL || '/' : '/'
  const urls = [
    `${base}data/art_exhibitions.json`,
    'https://raw.githubusercontent.com/Neltud/xArtists/main/data/art_exhibitions.json',
    'https://raw.githubusercontent.com/Neltud/xArtists/main/apps/frontend/public/data/art_exhibitions.json',
  ]

  let feed: ExhibitionFeed | null = null
  for (const url of urls) {
    feed = await fetchJson(url)
    if (feed) break
  }

  if (!feed) {
    feed = { updated: todayISO(), exhibitions: [] }
  }

  const met = await enrichNycFromMet()
  if (met.length) {
    const ids = new Set(feed.exhibitions.map(e => e.id))
    for (const e of met) {
      if (!ids.has(e.id)) feed.exhibitions.push(e)
    }
  }

  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: feed }))
    } catch {
      /* ignore */
    }
  }

  return feed
}

export async function fetchCityExhibitions(cityId: string): Promise<{
  exhibitions: ArtExhibition[]
  updated?: string
  source: 'cache' | 'network'
}> {
  const feed = await loadExhibitionFeed()
  return {
    exhibitions: filterByCity(feed.exhibitions, cityId),
    updated: feed.updated,
    source: 'network',
  }
}

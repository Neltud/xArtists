/**
 * OpenStreetMap / Overpass — POIs culturels + cache configurable.
 * Données © OpenStreetMap contributors (ODbL).
 */

export type OsmPoiKind = 'museum' | 'gallery' | 'arts_centre' | 'artwork'

export type OsmPoi = {
  id: string
  osmType: 'node' | 'way' | 'relation'
  osmId: number
  kind: OsmPoiKind
  name: string
  lat: number
  lng: number
  city?: string
  country?: string
  website?: string
  wikipedia?: string
  wikidata?: string
  openingHours?: string
  tourism?: string
  amenity?: string
}

export type OsmBBox = {
  south: number
  west: number
  north: number
  east: number
}

/** Config cache Overpass (lecture seule runtime) */
export type OsmCacheConfig = {
  /** Préfixe storage */
  prefix: string
  /** TTL sessionStorage (ms) */
  sessionTtlMs: number
  /** TTL localStorage (ms) — couche plus durable */
  localTtlMs: number
  /** Quantization degrés (0.05 ≈ 5.5 km) */
  quantizeDeg: number
  maxPois: number
  minZoom: number
  maxBboxAreaDeg2: number
}

const DEFAULT_CACHE: OsmCacheConfig = {
  prefix: 'xartists_osm_poi_v2:',
  sessionTtlMs: 30 * 60 * 1000,
  localTtlMs: 24 * 60 * 60 * 1000,
  quantizeDeg: 0.05,
  maxPois: 80,
  minZoom: 10,
  maxBboxAreaDeg2: 4,
}

let cacheConfig: OsmCacheConfig = { ...DEFAULT_CACHE }

/** Surcharge runtime (tests / settings) */
export function configureOsmCache(partial: Partial<OsmCacheConfig>) {
  cacheConfig = { ...cacheConfig, ...partial }
}

export function getOsmCacheConfig(): Readonly<OsmCacheConfig> {
  return cacheConfig
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

function cacheKey(b: OsmBBox): string {
  const q = (n: number) => {
    const step = cacheConfig.quantizeDeg
    return (Math.round(n / step) * step).toFixed(3)
  }
  return `${cacheConfig.prefix}${q(b.south)},${q(b.west)},${q(b.north)},${q(b.east)}`
}

type CacheEntry = { ts: number; pois: OsmPoi[] }

function readStore(store: Storage | undefined, key: string, ttl: number): OsmPoi[] | null {
  if (!store) return null
  try {
    const raw = store.getItem(key)
    if (!raw) return null
    const j = JSON.parse(raw) as CacheEntry
    if (Date.now() - j.ts > ttl) return null
    return j.pois
  } catch {
    return null
  }
}

function writeStore(store: Storage | undefined, key: string, pois: OsmPoi[]) {
  if (!store) return
  try {
    store.setItem(key, JSON.stringify({ ts: Date.now(), pois } satisfies CacheEntry))
  } catch {
    /* quota */
  }
}

function readCache(key: string): OsmPoi[] | null {
  const session =
    typeof sessionStorage !== 'undefined' ? sessionStorage : undefined
  const local = typeof localStorage !== 'undefined' ? localStorage : undefined
  return (
    readStore(session, key, cacheConfig.sessionTtlMs) ||
    readStore(local, key, cacheConfig.localTtlMs)
  )
}

function writeCache(key: string, pois: OsmPoi[]) {
  const session =
    typeof sessionStorage !== 'undefined' ? sessionStorage : undefined
  const local = typeof localStorage !== 'undefined' ? localStorage : undefined
  writeStore(session, key, pois)
  writeStore(local, key, pois)
}

/** Purge entrées xArtists OSM (session + local) */
export function clearOsmCache() {
  const stores = [sessionStorage, localStorage].filter(Boolean) as Storage[]
  for (const store of stores) {
    const keys: string[] = []
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i)
      if (k?.startsWith(cacheConfig.prefix) || k?.startsWith('xartists_osm_poi_')) keys.push(k)
    }
    keys.forEach(k => store.removeItem(k))
  }
}

function kindFromTags(tags: Record<string, string>): OsmPoiKind {
  if (tags.tourism === 'museum' || tags.museum) return 'museum'
  if (tags.tourism === 'gallery' || tags.shop === 'art') return 'gallery'
  if (tags.amenity === 'arts_centre' || tags.amenity === 'arts_center') return 'arts_centre'
  if (tags.tourism === 'artwork') return 'artwork'
  return 'museum'
}

function buildQuery(b: OsmBBox): string {
  const { south, west, north, east } = b
  return `
[out:json][timeout:25];
(
  nwr["tourism"="museum"](${south},${west},${north},${east});
  nwr["tourism"="gallery"](${south},${west},${north},${east});
  nwr["amenity"="arts_centre"](${south},${west},${north},${east});
  nwr["amenity"="arts_center"](${south},${west},${north},${east});
);
out center tags ${cacheConfig.maxPois};
`.trim()
}

function elementToPoi(el: {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}): OsmPoi | null {
  const tags = el.tags || {}
  const name = tags.name || tags['name:en'] || tags['name:fr'] || tags['name:es']
  if (!name) return null
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (lat == null || lng == null) return null
  return {
    id: `osm-${el.type}-${el.id}`,
    osmType: el.type as OsmPoi['osmType'],
    osmId: el.id,
    kind: kindFromTags(tags),
    name,
    lat,
    lng,
    city: tags['addr:city'] || tags['addr:suburb'],
    country: tags['addr:country'],
    website: tags.website || tags['contact:website'],
    wikipedia: tags.wikipedia,
    wikidata: tags.wikidata,
    openingHours: tags.opening_hours,
    tourism: tags.tourism,
    amenity: tags.amenity,
  }
}

function areaTooLarge(b: OsmBBox): boolean {
  const a = Math.abs(b.north - b.south) * Math.abs(b.east - b.west)
  return a > cacheConfig.maxBboxAreaDeg2
}

export function osmMinZoom(): number {
  return cacheConfig.minZoom
}

export async function fetchOsmCulturalPois(
  bbox: OsmBBox,
  signal?: AbortSignal,
): Promise<OsmPoi[]> {
  if (areaTooLarge(bbox)) return []

  const key = cacheKey(bbox)
  const cached = readCache(key)
  if (cached) return cached

  const body = `data=${encodeURIComponent(buildQuery(bbox))}`
  let lastErr: unknown

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': 'xArtists-dApp/1.0 (cultural map; github.com/Neltud/xArtists)',
        },
        body,
        signal,
      })
      if (!r.ok) {
        lastErr = new Error(`Overpass ${r.status}`)
        continue
      }
      const j = (await r.json()) as { elements?: unknown[] }
      const pois: OsmPoi[] = []
      for (const el of j.elements || []) {
        const p = elementToPoi(el as Parameters<typeof elementToPoi>[0])
        if (p) pois.push(p)
        if (pois.length >= cacheConfig.maxPois) break
      }
      writeCache(key, pois)
      return pois
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw e
      lastErr = e
    }
  }

  console.warn('[osm] Overpass failed', lastErr)
  return []
}

export function osmPoiColor(kind: OsmPoiKind): string {
  switch (kind) {
    case 'museum':
      return '#38bdf8'
    case 'gallery':
      return '#f472b6'
    case 'arts_centre':
      return '#a78bfa'
    case 'artwork':
      return '#fbbf24'
    default:
      return '#94a3b8'
  }
}

export function osmPoiLabel(kind: OsmPoiKind): string {
  switch (kind) {
    case 'museum':
      return 'Musée OSM'
    case 'gallery':
      return 'Galerie OSM'
    case 'arts_centre':
      return 'Centre d’art'
    case 'artwork':
      return 'Œuvre'
    default:
      return 'OSM'
  }
}

export function osmBrowseUrl(poi: OsmPoi): string {
  return `https://www.openstreetmap.org/${poi.osmType}/${poi.osmId}`
}

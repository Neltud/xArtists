/**
 * OpenStreetMap / Overpass — POIs culturels (musées, galeries, centres d’art).
 * Usage fair : cache session, debounce, User-Agent xArtists, pas de flood.
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

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const CACHE_PREFIX = 'xartists_osm_poi_v1:'
const MIN_ZOOM = 10
const MAX_POIS = 80

function cacheKey(b: OsmBBox): string {
  // quantize ~0.05° to improve hit rate
  const q = (n: number) => (Math.round(n * 20) / 20).toFixed(2)
  return `${CACHE_PREFIX}${q(b.south)},${q(b.west)},${q(b.north)},${q(b.east)}`
}

function readCache(key: string): OsmPoi[] | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const j = JSON.parse(raw) as { ts: number; pois: OsmPoi[] }
    if (Date.now() - j.ts > 1000 * 60 * 30) return null // 30 min
    return j.pois
  } catch {
    return null
  }
}

function writeCache(key: string, pois: OsmPoi[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), pois }))
  } catch {
    /* quota */
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
  // Timeout soft — Overpass [timeout:25]
  return `
[out:json][timeout:25];
(
  nwr["tourism"="museum"](${south},${west},${north},${east});
  nwr["tourism"="gallery"](${south},${west},${north},${east});
  nwr["amenity"="arts_centre"](${south},${west},${north},${east});
  nwr["amenity"="arts_center"](${south},${west},${north},${east});
);
out center tags 80;
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
  const osmType = el.type as OsmPoi['osmType']
  return {
    id: `osm-${el.type}-${el.id}`,
    osmType,
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

/** Bbox area degrees² — refuse huge queries */
function areaTooLarge(b: OsmBBox): boolean {
  const a = Math.abs(b.north - b.south) * Math.abs(b.east - b.west)
  return a > 4 // ~2°×2° max
}

export function osmMinZoom(): number {
  return MIN_ZOOM
}

/**
 * Récupère musées / galeries / arts centres dans une bbox (vue carte).
 */
export async function fetchOsmCulturalPois(bbox: OsmBBox, signal?: AbortSignal): Promise<OsmPoi[]> {
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
        if (pois.length >= MAX_POIS) break
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

/** Lien fiche OpenStreetMap */
export function osmBrowseUrl(poi: OsmPoi): string {
  return `https://www.openstreetmap.org/${poi.osmType}/${poi.osmId}`
}

/**
 * Catalogue OSM offline — bbox configurées → JSON matérialisé.
 * Utilisé par l’indexeur Akash (pas de PEM).
 * © OpenStreetMap contributors (ODbL).
 */

const OVERPASS = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter'

/** Bboxes culture (ville approx) — étendre via env OSM_BBOXES=json */
const DEFAULT_BBOXES = [
  { id: 'paris', name: 'Paris', south: 48.80, west: 2.25, north: 48.90, east: 2.42 },
  { id: 'london', name: 'London', south: 51.48, west: -0.20, north: 51.55, east: 0.02 },
  { id: 'nyc', name: 'New York', south: 40.70, west: -74.05, north: 40.80, east: -73.90 },
  { id: 'tokyo', name: 'Tokyo', south: 35.65, west: 139.70, north: 35.72, east: 139.80 },
  { id: 'amsterdam', name: 'Amsterdam', south: 52.35, west: 4.85, north: 52.40, east: 4.95 },
]

function loadBboxes() {
  if (process.env.OSM_BBOXES) {
    try {
      return JSON.parse(process.env.OSM_BBOXES)
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_BBOXES
}

function buildQuery(b) {
  return `
[out:json][timeout:40];
(
  nwr["tourism"="museum"](${b.south},${b.west},${b.north},${b.east});
  nwr["tourism"="gallery"](${b.south},${b.west},${b.north},${b.east});
  nwr["amenity"="arts_centre"](${b.south},${b.west},${b.north},${b.east});
);
out center tags 100;
`.trim()
}

function toPoi(el) {
  const tags = el.tags || {}
  const name = tags.name || tags['name:en'] || tags['name:fr']
  if (!name) return null
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (lat == null || lng == null) return null
  let kind = 'museum'
  if (tags.tourism === 'gallery') kind = 'gallery'
  if (tags.amenity === 'arts_centre' || tags.amenity === 'arts_center') kind = 'arts_centre'
  return {
    id: `osm-${el.type}-${el.id}`,
    osmType: el.type,
    osmId: el.id,
    kind,
    name,
    lat,
    lng,
    city: tags['addr:city'],
    website: tags.website || tags['contact:website'],
    wikipedia: tags.wikipedia,
    wikidata: tags.wikidata,
  }
}

export async function fetchBboxPois(bbox) {
  const body = `data=${encodeURIComponent(buildQuery(bbox))}`
  const r = await fetch(OVERPASS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'xArtists-akash-indexer/1.0',
    },
    body,
  })
  if (!r.ok) throw new Error(`Overpass ${r.status} ${bbox.id}`)
  const j = await r.json()
  const pois = []
  for (const el of j.elements || []) {
    const p = toPoi(el)
    if (p) pois.push(p)
  }
  return pois
}

/** Construit le snapshot offline multi-villes */
export async function buildOsmOfflineCatalog() {
  const boxes = loadBboxes()
  const regions = []
  for (const b of boxes) {
    try {
      const pois = await fetchBboxPois(b)
      regions.push({
        id: b.id,
        name: b.name,
        bbox: { south: b.south, west: b.west, north: b.north, east: b.east },
        count: pois.length,
        pois,
      })
      // polite pause
      await new Promise(r => setTimeout(r, 1500))
    } catch (e) {
      regions.push({
        id: b.id,
        name: b.name,
        error: String(e),
        count: 0,
        pois: [],
      })
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    source: 'overpass',
    license: 'ODbL — © OpenStreetMap contributors',
    regions,
    totalPois: regions.reduce((n, r) => n + (r.count || 0), 0),
  }
}

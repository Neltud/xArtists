/**
 * Daily museum catalog refresh — Met Collection API (public domain only).
 * Output: apps/frontend/public/data/museum_catalog_daily.json
 * No secrets / no PEM.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'apps/frontend/public/data/museum_catalog_daily.json')
const MET = 'https://collectionapi.metmuseum.org/public/collection/v1'

/** Seed + rotating IDs (sculptures & paintings often PD) */
const SEED = [
  436532, 437402, 436121, 437658, 436105, 437812, 437749, 436896, 435904, 437368,
  437283, 437995, 437792, 544439, 544448, 247414, 254961, 256583, 546502, 547802,
]

async function fetchJson(url) {
  const r = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'xArtists-catalog-bot/1.0' },
  })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}

function parseCm(dimensions) {
  if (!dimensions || typeof dimensions !== 'string') return null
  const m = dimensions.match(/\(([^)]*cm[^)]*)\)/i)
  if (m) return m[1].replace(/\s+/g, ' ').trim()
  const nums = [...dimensions.matchAll(/(\d+(?:\.\d+)?)\s*cm/gi)].map(x => x[1])
  if (nums.length >= 2) return `${nums[0]} cm × ${nums[1]} cm`
  return dimensions.slice(0, 100)
}

function isSculpture(obj) {
  const blob = `${obj.objectName || ''} ${obj.medium || ''} ${obj.title || ''}`.toLowerCase()
  return /sculpt|marble|bronze|statue|bust|stone/.test(blob)
}

async function loadObject(id) {
  try {
    const j = await fetchJson(`${MET}/objects/${id}`)
    if (!j.isPublicDomain) return null
    const img = j.primaryImageSmall || j.primaryImage
    if (!img) return null
    return {
      id: `met-${j.objectID}`,
      metId: j.objectID,
      title: j.title || 'Untitled',
      artist: j.artistDisplayName || 'Unknown',
      year: j.objectDate || '',
      medium: j.medium || '',
      dimensions: parseCm(j.dimensions) || j.dimensions || '',
      image: img,
      imageFull: j.primaryImage || img,
      department: j.department || '',
      kind: isSculpture(j) ? 'sculpture' : 'painting',
      license: 'Met Open Access / Public Domain',
      source: 'met-api',
      updatedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

async function main() {
  // Rotate seed slightly by day-of-year so catalog evolves
  const day = Math.floor(Date.now() / 86400000)
  const rotated = SEED.map((id, i) => id + ((day + i) % 7))
  const ids = [...new Set([...SEED, ...rotated])].slice(0, 28)

  const works = []
  for (const id of ids) {
    const w = await loadObject(id)
    if (w) works.push(w)
    await new Promise(r => setTimeout(r, 120)) // polite rate limit
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'collectionapi.metmuseum.org',
    note: 'Public domain only · daily refresh · not an investment',
    count: works.length,
    works,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n')
  console.log(`Wrote ${works.length} works → ${OUT}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

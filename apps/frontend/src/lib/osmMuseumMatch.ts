/**
 * Matcher POI OpenStreetMap → salle virtuelle museumWorldCatalog.
 */
import {
  VIRTUAL_MUSEUMS,
  getMuseum,
  museumIdForCity,
  type VirtualMuseum,
} from './museumWorldCatalog'
import type { OsmPoi } from './osmOverpass'

export type OsmMuseumMatch = {
  museumId: string
  museum: VirtualMuseum
  score: number
  reason: 'exact-name' | 'alias' | 'city' | 'partial-name'
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Score 0–1 similarité simple (tokens communs) */
function tokenOverlap(a: string, b: string): number {
  const ta = new Set(norm(a).split(' ').filter(t => t.length > 2))
  const tb = new Set(norm(b).split(' ').filter(t => t.length > 2))
  if (!ta.size || !tb.size) return 0
  let hit = 0
  for (const t of ta) if (tb.has(t)) hit++
  return hit / Math.max(ta.size, tb.size)
}

/**
 * Tente d’associer un POI OSM à un musée virtuel xArtists.
 */
export function matchOsmToVirtualMuseum(poi: OsmPoi): OsmMuseumMatch | null {
  const nName = norm(poi.name)
  if (!nName) return null

  // 1) Nom exact / inclusion forte avec name ou aliases
  for (const m of VIRTUAL_MUSEUMS) {
    const mn = norm(m.name)
    if (nName === mn || nName.includes(mn) || mn.includes(nName)) {
      return { museumId: m.id, museum: m, score: 0.95, reason: 'exact-name' }
    }
    for (const a of m.aliases || []) {
      const an = norm(a)
      if (an.length >= 4 && (nName.includes(an) || an.includes(nName))) {
        return { museumId: m.id, museum: m, score: 0.88, reason: 'alias' }
      }
    }
  }

  // 2) Meilleur score partiel sur le nom
  let best: OsmMuseumMatch | null = null
  for (const m of VIRTUAL_MUSEUMS) {
    const s = Math.max(
      tokenOverlap(poi.name, m.name),
      ...(m.aliases || []).map(a => tokenOverlap(poi.name, a)),
    )
    if (s >= 0.45 && (!best || s > best.score)) {
      best = { museumId: m.id, museum: m, score: s, reason: 'partial-name' }
    }
  }
  if (best && best.score >= 0.55) return best

  // 3) Ville seule → premier musée de la ville (ex. Paris → louvre prioritaires via ordre PROFILES)
  const city = poi.city || ''
  if (city) {
    const mid = museumIdForCity(city)
    if (mid) {
      const m = getMuseum(mid)
      if (m) return { museumId: m.id, museum: m, score: 0.4, reason: 'city' }
    }
  }

  return best
}

export function museumTravelFromOsm(poi: OsmPoi, match: OsmMuseumMatch) {
  return {
    id: poi.id,
    city: match.museum.city,
    country: match.museum.country,
    focus: poi.name,
    space: 'world_tour' as const,
    source: 'map' as const,
    museumId: match.museumId,
  }
}

/**
 * Charge un RoomBlueprint — toujours un plan 3D pour chaque musée.
 */
import type { RoomBlueprint } from './roomBlueprint'
import { MUSEUM_BLUEPRINT_REF } from './roomBlueprint'
import { builtinBlueprintForMuseum, MUSEUM_TO_LAYOUT } from './builtinBlueprints'

const cache = new Map<string, RoomBlueprint>()

export async function loadBlueprint(museumId: string): Promise<RoomBlueprint> {
  if (cache.has(museumId)) return cache.get(museumId)!

  const ref = MUSEUM_BLUEPRINT_REF[museumId]
  const file =
    ref?.source === 'json' ? ref.ref : MUSEUM_TO_LAYOUT[museumId] || museumId

  const base = import.meta.env.BASE_URL || '/'
  const urls = [`${base}blueprints/${file}.json`, `${base}blueprints/${museumId}.json`]

  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: 'force-cache' })
      if (!r.ok) continue
      const j = (await r.json()) as RoomBlueprint
      if (!j?.walls?.length) continue
      cache.set(museumId, j)
      return j
    } catch {
      /* next */
    }
  }

  const fallback = builtinBlueprintForMuseum(museumId)
  cache.set(museumId, fallback)
  return fallback
}

/**
 * Sol praticable — bbox/polygone avec marge intérieure (ne remplace pas collision murs).
 */
export function pointInBlueprintFloor(bp: RoomBlueprint, x: number, y: number): boolean {
  const rooms = bp.rooms || []
  if (!rooms.length) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const w of bp.walls) {
      minX = Math.min(minX, w.x1, w.x2)
      minY = Math.min(minY, w.y1, w.y2)
      maxX = Math.max(maxX, w.x1, w.x2)
      maxY = Math.max(maxY, w.y1, w.y2)
    }
    // marge intérieure plus large pour rester loin des murs extérieurs
    const pad = 0.55
    return x >= minX + pad && x <= maxX - pad && y >= minY + pad && y <= maxY - pad
  }
  for (const room of rooms) {
    if (pointInPolygon({ x, y }, room.polygon, 0.4)) return true
  }
  return false
}

function pointInPolygon(
  p: { x: number; y: number },
  poly: { x: number; y: number }[],
  inset = 0,
): boolean {
  // inset simple: shrink test via requiring distance to edges later; basic ray-cast first
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y
    const xj = poly[j].x,
      yj = poly[j].y
    const intersect =
      yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-9) + xi
    if (intersect) inside = !inside
  }
  if (!inside || inset <= 0) return inside
  // reject if too close to any edge
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const dx = poly[i].x - poly[j].x
    const dy = poly[i].y - poly[j].y
    const len2 = dx * dx + dy * dy || 1
    let t = ((p.x - poly[j].x) * dx + (p.y - poly[j].y) * dy) / len2
    t = Math.max(0, Math.min(1, t))
    const cx = poly[j].x + t * dx
    const cy = poly[j].y + t * dy
    if (Math.hypot(p.x - cx, p.y - cy) < inset) return false
  }
  return true
}

/**
 * Charge un RoomBlueprint exporté depuis blend-glade-wolf-grove.
 * Fichiers : public/blueprints/{id}.json
 */
import type { RoomBlueprint } from './roomBlueprint'
import { MUSEUM_BLUEPRINT_REF } from './roomBlueprint'

const cache = new Map<string, RoomBlueprint | null>()

export async function loadBlueprint(museumId: string): Promise<RoomBlueprint | null> {
  if (cache.has(museumId)) return cache.get(museumId) ?? null

  const ref = MUSEUM_BLUEPRINT_REF[museumId]
  const file =
    ref?.source === 'json'
      ? ref.ref
      : ref?.source === 'blend-sample'
        ? ref.ref
        : museumId

  const base = import.meta.env.BASE_URL || '/'
  const urls = [
    `${base}blueprints/${file}.json`,
    `${base}blueprints/${museumId}.json`,
  ]

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
  cache.set(museumId, null)
  return null
}

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
    return x >= minX && x <= maxX && y >= minY && y <= maxY
  }
  for (const room of rooms) {
    if (pointInPolygon({ x, y }, room.polygon)) return true
  }
  return false
}

function pointInPolygon(p: { x: number; y: number }, poly: { x: number; y: number }[]): boolean {
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
  return inside
}

/**
 * Visiteurs de salle — virtuels (NPC) + réels (compteur présence session).
 */

const REAL_KEY = 'xartists_museum_presence'

export type VisitorKind = 'virtual' | 'real'

export type PresenceSnapshot = {
  virtual: number
  realApprox: number
  you: boolean
}

/** Seed pseudo-aléatoire stable par musée + minute */
export function virtualVisitorCount(museumId: string): number {
  let h = 0
  const s = museumId + String(Math.floor(Date.now() / 60000))
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return 3 + Math.abs(h % 9)
}

export function registerRealPresence(museumId: string): number {
  try {
    const raw = sessionStorage.getItem(REAL_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    map[museumId] = Date.now()
    // purge > 15 min
    const now = Date.now()
    for (const k of Object.keys(map)) {
      if (now - map[k] > 15 * 60 * 1000) delete map[k]
    }
    sessionStorage.setItem(REAL_KEY, JSON.stringify(map))
    return Object.keys(map).length
  } catch {
    return 1
  }
}

export function presenceSnapshot(museumId: string): PresenceSnapshot {
  const realApprox = registerRealPresence(museumId)
  return {
    virtual: virtualVisitorCount(museumId),
    realApprox: Math.max(1, realApprox),
    you: true,
  }
}

/** Points de promenade NPC dans le plan (fraction du bbox) */
export function visitorWaypoints(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  n: number
): { x: number; z: number }[] {
  const pts: { x: number; z: number }[] = []
  const w = maxX - minX
  const d = maxY - minY
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n
    pts.push({
      x: minX + w * (0.2 + 0.6 * ((Math.sin(i * 2.3) + 1) / 2)),
      z: minY + d * (0.25 + 0.5 * t),
    })
  }
  return pts
}

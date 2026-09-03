/**
 * Map (Tours) → Musée — travel context without Framer/Three.
 * Session survives soft navigation; cleared after museum consumes it.
 */

export type TravelDestination = {
  id: string
  city: string
  country?: string
  focus?: string
  space?: 'catzligue' | 'mydee' | 'world_tour' | 'vr_core'
  source?: 'tours' | 'world_tour' | 'map'
  /** id musée résolu (louvre, rijks…) */
  museumId?: string
}

const KEY = 'xartists_travel'

export function setTravelDestination(d: TravelDestination): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...d, at: Date.now() }))
  } catch {
    /* ignore */
  }
}

export function consumeTravelDestination(): TravelDestination | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    sessionStorage.removeItem(KEY)
    const j = JSON.parse(raw) as TravelDestination & { at?: number }
    if (j.at && Date.now() - j.at > 30 * 60 * 1000) return null
    return j
  } catch {
    return null
  }
}

export function peekTravelDestination(): TravelDestination | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as TravelDestination
  } catch {
    return null
  }
}

export function museumTravelHref(d: TravelDestination): string {
  setTravelDestination(d)
  const q = new URLSearchParams()
  if (d.space) q.set('space', d.space)
  if (d.city) q.set('city', d.city)
  if (d.id) q.set('stop', d.id)
  if (d.museumId) q.set('museum', d.museumId)
  const s = q.toString()
  return s ? `/museum?${s}` : '/museum'
}

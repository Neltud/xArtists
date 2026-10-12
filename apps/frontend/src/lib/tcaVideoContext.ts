/**
 * ATC → Classroom context bridge (Sprint 1 Module B).
 * Carries youtube video_id / lesson_id across the SAMPLE → FULL transition.
 */

const KEY = 'xartists_tca_context'

export type TcaSessionContext = {
  video_id: string
  lesson_id: string
  topic?: string
  lastTimestamp?: number
  updatedAt: number
}

export function saveTcaContext(ctx: Omit<TcaSessionContext, 'updatedAt'>): void {
  const full: TcaSessionContext = { ...ctx, updatedAt: Date.now() }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(full))
  } catch {
    /* */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xartists:tca-context', { detail: full }))
  }
}

export function loadTcaContext(): TcaSessionContext | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const j = JSON.parse(raw) as TcaSessionContext
    if (!j.video_id || !j.lesson_id) return null
    return j
  } catch {
    return null
  }
}

export function clearTcaContext(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* */
  }
}

/**
 * Mode Pitch B2B — masque logs techniques, active données démo propres.
 * Pas de branding partenaire tiers.
 */
const KEY = 'xartists_pitch_mode_v1'
export const PITCH_EVENT = 'xartists-pitch-mode'

export function isPitchMode(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setPitchMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    /* */
  }
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('pitch-mode', on)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PITCH_EVENT, { detail: { on } }))
  }
}

export function syncPitchModeClass(): void {
  if (typeof document === 'undefined') return
  document.body.classList.toggle('pitch-mode', isPitchMode())
}

/** Métriques démo propres (lecture seule UI). */
export const PITCH_DEMO = {
  troUsd: 0.048,
  egldUsd: 28.5,
  tvlUsd: 124_000,
  holders: 842,
  sentiment: 0.12,
  note: 'Données démo pitch — non live',
} as const

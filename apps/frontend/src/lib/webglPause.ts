/**
 * Pause WebGL / RAF quand une modal plein écran est ouverte (batterie mobile).
 * Événement: window 'xartists-webgl-pause' { detail: { paused: boolean } }
 * body.webgl-paused → touch-action:none + pointer-events:none sur canvas 3D.
 */

export const WEBGL_PAUSE_EVENT = 'xartists-webgl-pause'

let pauseCount = 0

function syncBodyClass(paused: boolean): void {
  if (typeof document === 'undefined') return
  document.body.classList.toggle('webgl-paused', paused)
}

export function requestWebglPause(): void {
  pauseCount += 1
  if (pauseCount === 1) {
    syncBodyClass(true)
    window.dispatchEvent(new CustomEvent(WEBGL_PAUSE_EVENT, { detail: { paused: true } }))
  }
}

export function releaseWebglPause(): void {
  pauseCount = Math.max(0, pauseCount - 1)
  if (pauseCount === 0) {
    syncBodyClass(false)
    window.dispatchEvent(new CustomEvent(WEBGL_PAUSE_EVENT, { detail: { paused: false } }))
  }
}

export function isWebglPaused(): boolean {
  return pauseCount > 0
}

export function useWebglPauseOnOpen(open: boolean): void {
  if (typeof window === 'undefined') return
  if (open) requestWebglPause()
  else releaseWebglPause()
}

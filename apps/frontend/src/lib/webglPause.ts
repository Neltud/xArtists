/**
 * Pause WebGL / RAF quand une modal plein écran est ouverte (batterie mobile).
 * Événement: window 'xartists-webgl-pause' { detail: { paused: boolean } }
 */

export const WEBGL_PAUSE_EVENT = 'xartists-webgl-pause'

let pauseCount = 0

export function requestWebglPause(): void {
  pauseCount += 1
  if (pauseCount === 1) {
    window.dispatchEvent(new CustomEvent(WEBGL_PAUSE_EVENT, { detail: { paused: true } }))
  }
}

export function releaseWebglPause(): void {
  pauseCount = Math.max(0, pauseCount - 1)
  if (pauseCount === 0) {
    window.dispatchEvent(new CustomEvent(WEBGL_PAUSE_EVENT, { detail: { paused: false } }))
  }
}

export function isWebglPaused(): boolean {
  return pauseCount > 0
}

/** Hook-friendly: call on modal open/close */
export function useWebglPauseOnOpen(open: boolean): void {
  // implemented inline in components to avoid react import here
  if (typeof window === 'undefined') return
  if (open) requestWebglPause()
  else releaseWebglPause()
}

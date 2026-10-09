import { useEffect } from 'react'
import { requestWebglPause, releaseWebglPause, WEBGL_PAUSE_EVENT } from '../lib/webglPause'

/** Suspende le 3D tant que `open` est true (modales Checkout, DeFi, Legal…). */
export function useWebglPauseWhen(open: boolean): void {
  useEffect(() => {
    if (!open) return
    requestWebglPause()
    return () => releaseWebglPause()
  }, [open])
}

/** Abonne un canvas : retourne un flag paused réactif */
export function useWebglPausedState(): boolean {
  const { useState } = require('react') as typeof import('react')
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d && typeof d.paused === 'boolean') setPaused(d.paused)
    }
    window.addEventListener(WEBGL_PAUSE_EVENT, on)
    return () => window.removeEventListener(WEBGL_PAUSE_EVENT, on)
  }, [])
  return paused
}

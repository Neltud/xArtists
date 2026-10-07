/**
 * Zone ambience — loop, fade, autoplay-safe.
 * Missing MP3 → silent fail (no throw, no 3D block).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  isMusicEnabled,
  setMusicEnabled,
  zoneFromPath,
  ZONE_TRACKS,
  type ZoneId,
} from '../config/nelsonAudio'

function fadeTo(
  audio: HTMLAudioElement,
  target: number,
  ms: number,
  onDone?: () => void,
) {
  const start = audio.volume
  const t0 = performance.now()
  let raf = 0
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / ms)
    try {
      audio.volume = Math.max(0, Math.min(1, start + (target - start) * p))
    } catch {
      /* */
    }
    if (p < 1) raf = requestAnimationFrame(step)
    else onDone?.()
  }
  raf = requestAnimationFrame(step)
  return () => cancelAnimationFrame(raf)
}

export function useGalleryAudio() {
  const location = useLocation()
  const [enabled, setEnabled] = useState(false)
  const [zone, setZone] = useState<ZoneId>('gallery')
  const [ready, setReady] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)
  const fadeCancel = useRef<(() => void) | null>(null)
  const failedSrc = useRef<Set<string>>(new Set())

  useEffect(() => {
    setEnabled(isMusicEnabled())
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d && typeof d.enabled === 'boolean') setEnabled(d.enabled)
    }
    window.addEventListener('xartists-music', on)
    return () => window.removeEventListener('xartists-music', on)
  }, [])

  useEffect(() => {
    const unlock = () => {
      unlockedRef.current = true
      const a = audioRef.current
      if (a && isMusicEnabled()) a.play().catch(() => {})
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    const a = new Audio()
    a.loop = true
    a.preload = 'metadata'
    a.crossOrigin = 'anonymous'
    // Silent error handlers — never throw into React
    a.onerror = () => {
      try {
        failedSrc.current.add(a.currentSrc || a.src)
      } catch {
        /* */
      }
      setReady(false)
    }
    audioRef.current = a
    return () => {
      fadeCancel.current?.()
      try {
        a.pause()
        a.removeAttribute('src')
        a.load()
      } catch {
        /* */
      }
      audioRef.current = null
    }
  }, [])

  const applyZone = useCallback((z: ZoneId, play: boolean) => {
    const a = audioRef.current
    if (!a) return
    const track = ZONE_TRACKS[z]
    const nextSrc = track.src

    if (failedSrc.current.has(nextSrc)) {
      setReady(false)
      return
    }

    const switchSrc = () => {
      try {
        const already = a.src && (a.src === nextSrc || a.src.endsWith(nextSrc.replace(/^.*\//, '')))
        if (!already) {
          a.src = nextSrc
          a.load()
        }
        a.volume = 0
        if (play && unlockedRef.current) {
          a.play()
            .then(() => {
              setReady(true)
              fadeCancel.current?.()
              fadeCancel.current = fadeTo(a, track.volume, 900)
            })
            .catch(() => {
              setReady(false)
            })
        }
      } catch {
        setReady(false)
      }
    }

    try {
      if (a.src && !a.paused) {
        fadeCancel.current?.()
        fadeCancel.current = fadeTo(a, 0, 400, () => {
          try {
            a.pause()
          } catch {
            /* */
          }
          switchSrc()
        })
      } else {
        switchSrc()
      }
    } catch {
      setReady(false)
    }
  }, [])

  useEffect(() => {
    const z = zoneFromPath(location.pathname)
    setZone(z)
    applyZone(z, enabled)
  }, [location.pathname, enabled, applyZone])

  const toggle = useCallback(() => {
    const next = !enabled
    setMusicEnabled(next)
    setEnabled(next)
    unlockedRef.current = true
    const a = audioRef.current
    if (!a) return
    if (next) {
      applyZone(zoneFromPath(location.pathname), true)
    } else {
      fadeCancel.current?.()
      fadeCancel.current = fadeTo(a, 0, 350, () => {
        try {
          a.pause()
        } catch {
          /* */
        }
      })
    }
  }, [enabled, applyZone, location.pathname])

  return { enabled, zone, ready, toggle, label: ZONE_TRACKS[zone].label }
}

/**
 * Gallery / zone ambience — HTML5 Audio, loop, fade in/out, autoplay-safe.
 * First user gesture unlocks playback (browser policy).
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
    audio.volume = start + (target - start) * p
    if (p < 1) {
      raf = requestAnimationFrame(step)
    } else {
      onDone?.()
    }
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

  useEffect(() => {
    setEnabled(isMusicEnabled())
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d && typeof d.enabled === 'boolean') setEnabled(d.enabled)
    }
    window.addEventListener('xartists-music', on)
    return () => window.removeEventListener('xartists-music', on)
  }, [])

  // Unlock on first interaction anywhere
  useEffect(() => {
    const unlock = () => {
      unlockedRef.current = true
      const a = audioRef.current
      if (a && isMusicEnabled()) {
        a.play().catch(() => {})
      }
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // Create single audio element
  useEffect(() => {
    const a = new Audio()
    a.loop = true
    a.preload = 'auto'
    a.crossOrigin = 'anonymous'
    audioRef.current = a
    return () => {
      fadeCancel.current?.()
      a.pause()
      a.src = ''
      audioRef.current = null
    }
  }, [])

  const applyZone = useCallback(
    (z: ZoneId, play: boolean) => {
      const a = audioRef.current
      if (!a) return
      const track = ZONE_TRACKS[z]
      const nextSrc = track.src
      const targetVol = track.volume

      const switchSrc = () => {
        if (!a.src.endsWith(nextSrc.replace(/^.*\//, '')) && a.src !== nextSrc) {
          a.src = nextSrc
          a.load()
        }
        a.volume = 0
        if (play && unlockedRef.current) {
          a.play()
            .then(() => {
              setReady(true)
              fadeCancel.current?.()
              fadeCancel.current = fadeTo(a, targetVol, 900)
            })
            .catch(() => setReady(false))
        }
      }

      if (a.src && !a.paused) {
        fadeCancel.current?.()
        fadeCancel.current = fadeTo(a, 0, 400, () => {
          a.pause()
          switchSrc()
        })
      } else {
        switchSrc()
      }
    },
    [],
  )

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
      fadeCancel.current = fadeTo(a, 0, 350, () => a.pause())
    }
  }, [enabled, applyZone, location.pathname])

  return { enabled, zone, ready, toggle, label: ZONE_TRACKS[zone].label }
}

/** Zone ambience — mp3 → b64 → procedural drone. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  isMusicEnabled,
  setMusicEnabled,
  zoneFromPath,
  ZONE_TRACKS,
  resolveTrackSrc,
  type ZoneId,
} from '../config/nelsonAudio'
import { startProceduralDrone, type DroneHandle } from '../lib/proceduralAmbience'

function fadeTo(audio: HTMLAudioElement, target: number, ms: number, onDone?: () => void) {
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
  const droneRef = useRef<DroneHandle | null>(null)
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
    a.preload = 'auto'
    a.onerror = () => setReady(false)
    audioRef.current = a
    return () => {
      fadeCancel.current?.()
      droneRef.current?.stop()
      droneRef.current = null
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

  const stopAll = () => {
    fadeCancel.current?.()
    droneRef.current?.stop()
    droneRef.current = null
    const a = audioRef.current
    if (a) {
      try {
        a.pause()
      } catch {
        /* */
      }
    }
  }

  const applyZone = useCallback(async (z: ZoneId, play: boolean) => {
    const a = audioRef.current
    if (!a) return
    const track = ZONE_TRACKS[z]

    if (!play) {
      stopAll()
      setReady(false)
      return
    }

    const src = await resolveTrackSrc(track)

    if (src) {
      droneRef.current?.stop()
      droneRef.current = null
      try {
        a.src = src
        a.load()
        a.volume = 0
        if (unlockedRef.current) {
          await a.play()
          setReady(true)
          fadeCancel.current?.()
          fadeCancel.current = fadeTo(a, track.volume, 900)
        }
      } catch {
        setReady(false)
      }
      return
    }

    // Procedural fallback so user always hears *something* after enabling Musique
    try {
      a.pause()
    } catch {
      /* */
    }
    droneRef.current?.stop()
    if (unlockedRef.current) {
      droneRef.current = startProceduralDrone(z)
      setReady(true)
    } else setReady(false)
  }, [])

  useEffect(() => {
    const z = zoneFromPath(location.pathname)
    setZone(z)
    void applyZone(z, enabled)
  }, [location.pathname, enabled, applyZone])

  const toggle = useCallback(() => {
    const next = !enabled
    setMusicEnabled(next)
    setEnabled(next)
    unlockedRef.current = true
    if (next) void applyZone(zoneFromPath(location.pathname), true)
    else {
      stopAll()
      setReady(false)
    }
  }, [enabled, applyZone, location.pathname])

  return { enabled, zone, ready, toggle, label: ZONE_TRACKS[zone].label }
}

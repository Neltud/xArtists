/**
 * BackgroundMusicPlayer — Nelson Tuduri via YouTube IFrame API.
 * CRITICAL: getSnapshot must return referentially stable values (React #185).
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getEmpireState, subscribeEmpire, type EmpireZone } from '../store/empireStore'
import {
  NELSON_DEFAULT_TRACK,
  ZONE_VOLUME,
  isMusicEnabled,
  setMusicEnabled,
} from '../config/nelsonAudio'

declare global {
  interface Window {
    YT?: {
      Player: new (el: string | HTMLElement, opts: Record<string, unknown>) => YTPlayer
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  setVolume: (n: number) => void
  getVolume: () => number
  destroy?: () => void
}

type AudioSnap = { zone: EmpireZone; audioVolume: number }

/** Cached snapshot — same reference while zone/volume unchanged */
let _audioSnap: AudioSnap = { zone: 'museum', audioVolume: 1 }

function getAudioSnapshot(): AudioSnap {
  const s = getEmpireState()
  if (_audioSnap.zone === s.zone && _audioSnap.audioVolume === s.audioVolume) {
    return _audioSnap
  }
  _audioSnap = { zone: s.zone, audioVolume: s.audioVolume }
  return _audioSnap
}

function getServerAudioSnapshot(): AudioSnap {
  return _audioSnap
}

function useEmpireAudio(): AudioSnap {
  return useSyncExternalStore(subscribeEmpire, getAudioSnapshot, getServerAudioSnapshot)
}

function loadYtApi(): Promise<void> {
  return new Promise(resolve => {
    if (window.YT?.Player) {
      resolve()
      return
    }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      try {
        prev?.()
      } catch {
        /* */
      }
      resolve()
    }
    if (!document.querySelector('script[data-xartists-yt]')) {
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      s.async = true
      s.dataset.xartistsYt = '1'
      document.head.appendChild(s)
    }
  })
}

function fadeVolume(
  player: YTPlayer,
  from: number,
  to: number,
  ms: number,
  cancelRef: { id: number | null },
) {
  if (cancelRef.id != null) window.clearInterval(cancelRef.id)
  const steps = Math.max(8, Math.floor(ms / 40))
  let i = 0
  cancelRef.id = window.setInterval(() => {
    i += 1
    const t = Math.min(1, i / steps)
    const v = Math.round(from + (to - from) * t)
    try {
      player.setVolume(v)
    } catch {
      /* */
    }
    if (t >= 1 && cancelRef.id != null) {
      window.clearInterval(cancelRef.id)
      cancelRef.id = null
    }
  }, 40)
}

export default function BackgroundMusicPlayer() {
  const { zone, audioVolume } = useEmpireAudio()
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const playerRef = useRef<YTPlayer | null>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const targetVol = useRef(100)
  const currentVol = useRef(100)
  const fadeCancel = useRef<{ id: number | null }>({ id: null })

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
    const base = ZONE_VOLUME[zone as keyof typeof ZONE_VOLUME] ?? audioVolume
    const factor = zone === 'command' ? 0.85 : 1
    const next = Math.round(Math.max(0, Math.min(1, base * factor)) * 100)
    targetVol.current = next
    const p = playerRef.current
    if (!p) return
    const from = currentVol.current
    fadeVolume(p, from, next, zone === 'transition' ? 600 : 900, fadeCancel.current)
    currentVol.current = next
  }, [zone, audioVolume])

  useEffect(() => {
    if (!enabled) {
      try {
        playerRef.current?.pauseVideo()
      } catch {
        /* */
      }
      return
    }

    let cancelled = false
    ;(async () => {
      await loadYtApi()
      if (cancelled || !hostRef.current || !window.YT?.Player) return

      if (playerRef.current) {
        try {
          playerRef.current.playVideo()
          playerRef.current.setVolume(targetVol.current)
          currentVol.current = targetVol.current
        } catch {
          /* */
        }
        setReady(true)
        return
      }

      const el = document.createElement('div')
      el.id = 'xartists-nelson-yt'
      hostRef.current.innerHTML = ''
      hostRef.current.appendChild(el)

      playerRef.current = new window.YT.Player(el, {
        height: '1',
        width: '1',
        videoId: NELSON_DEFAULT_TRACK.youtubeId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          loop: 1,
          playlist: NELSON_DEFAULT_TRACK.youtubeId,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (ev: { target: YTPlayer }) => {
            if (cancelled) return
            try {
              ev.target.setVolume(targetVol.current)
              currentVol.current = targetVol.current
              ev.target.playVideo()
            } catch {
              /* */
            }
            setReady(true)
          },
          onStateChange: (ev: { data: number; target: YTPlayer }) => {
            if (window.YT && ev.data === window.YT.PlayerState.ENDED) {
              try {
                ev.target.playVideo()
              } catch {
                /* */
              }
            }
          },
        },
      })
    })()

    return () => {
      cancelled = true
      if (fadeCancel.current.id != null) {
        window.clearInterval(fadeCancel.current.id)
        fadeCancel.current.id = null
      }
    }
  }, [enabled])

  const toggle = () => {
    const next = !enabled
    setMusicEnabled(next)
    setEnabled(next)
  }

  return (
    <>
      <div
        ref={hostRef}
        className="fixed opacity-0 pointer-events-none w-px h-px overflow-hidden"
        aria-hidden
      />
      <button
        type="button"
        onClick={toggle}
        className={`fixed bottom-[4.5rem] md:bottom-10 right-[4.75rem] z-50 rounded-full border backdrop-blur-md px-3 py-2 text-[11px] font-medium shadow-lg transition-all ${
          enabled
            ? 'border-violet-400/40 bg-violet-950/70 text-white'
            : 'border-amber-400/50 bg-amber-950/80 text-amber-100 animate-pulse'
        }`}
        title={enabled ? 'Couper musique Nelson' : 'Activer musique Nelson Tuduri'}
        aria-pressed={enabled}
      >
        {enabled ? (ready ? '🎵 Musique' : '🎵 …') : '🎵 Activer musique'}
        <span className="hidden sm:inline text-zinc-500 ml-1">
          · {zone === 'command' ? '20%' : zone === 'transition' ? '50%' : '100%'}
        </span>
      </button>
    </>
  )
}

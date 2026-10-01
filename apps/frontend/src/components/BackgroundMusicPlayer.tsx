/**
 * BackgroundMusicPlayer — Nelson Tuduri (YouTube).
 * React #185: zero useSyncExternalStore, zero empire store subscriptions.
 * Zone volume is fixed; user toggles only.
 */
import { useEffect, useRef, useState } from 'react'
import {
  NELSON_DEFAULT_TRACK,
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
  destroy?: () => void
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

export default function BackgroundMusicPlayer() {
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const playerRef = useRef<YTPlayer | null>(null)
  const hostRef = useRef<HTMLDivElement>(null)

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
          playerRef.current.setVolume(70)
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
              ev.target.setVolume(70)
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
        title={enabled ? 'Couper musique' : 'Activer musique Nelson Tuduri'}
        aria-pressed={enabled}
      >
        {enabled ? (ready ? '🎵 Musique' : '🎵 …') : '🎵 Activer musique'}
      </button>
    </>
  )
}

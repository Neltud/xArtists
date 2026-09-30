/**
 * BackgroundMusicPlayer — Nelson Tuduri soundscapes via YouTube IFrame API.
 * Volume follows empireStore.audioVolume (museum 100% · command 20%).
 * User gesture required to start (browser autoplay policy).
 */
import { useEffect, useRef, useState } from 'react'
import { useSyncExternalStore } from 'react'
import {
  getEmpireState,
  subscribeEmpire,
} from '../store/empireStore'
import {
  NELSON_DEFAULT_TRACK,
  ZONE_VOLUME,
  isMusicEnabled,
  setMusicEnabled,
} from '../config/nelsonAudio'

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: string | HTMLElement,
        opts: Record<string, unknown>,
      ) => YTPlayer
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  setVolume: (v: number) => void
  getVolume: () => number
  destroy: () => void
  getPlayerState: () => number
}

function useEmpireAudio() {
  return useSyncExternalStore(
    subscribeEmpire,
    () => {
      const s = getEmpireState()
      return { zone: s.zone, audioVolume: s.audioVolume }
    },
    () => ({ zone: 'museum' as const, audioVolume: 1 }),
  )
}

function loadYtApi(): Promise<void> {
  return new Promise(resolve => {
    if (window.YT?.Player) {
      resolve()
      return
    }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
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
  const { zone, audioVolume } = useEmpireAudio()
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const playerRef = useRef<YTPlayer | null>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const targetVol = useRef(100)

  useEffect(() => {
    setEnabled(isMusicEnabled())
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d && typeof d.enabled === 'boolean') setEnabled(d.enabled)
    }
    window.addEventListener('xartists-music', on)
    return () => window.removeEventListener('xartists-music', on)
  }, [])

  // Target volume from zone (iframe 0–100)
  useEffect(() => {
    const base = ZONE_VOLUME[zone] ?? audioVolume
    targetVol.current = Math.round(Math.max(0, Math.min(1, base)) * 100)
    try {
      playerRef.current?.setVolume(targetVol.current)
    } catch {
      /* */
    }
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
        height: '0',
        width: '0',
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
              ev.target.playVideo()
            } catch {
              /* */
            }
            setReady(true)
          },
          onStateChange: (ev: { data: number; target: YTPlayer }) => {
            // loop if ended
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
      <div ref={hostRef} className="sr-only" aria-hidden />
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-[4.5rem] md:bottom-10 right-[4.75rem] z-50 rounded-full border border-white/15 bg-black/70 backdrop-blur-md px-3 py-2 text-[11px] font-medium text-zinc-300 shadow-lg hover:border-violet-400/40 hover:text-white transition-all"
        title={enabled ? 'Couper musique Nelson' : 'Musique Nelson Tuduri'}
        aria-pressed={enabled}
      >
        {enabled ? (ready ? '🎵 Music on' : '🎵 …') : '🎵 Music off'}
        <span className="hidden sm:inline text-zinc-500 ml-1">
          · {zone === 'command' ? '20%' : zone === 'transition' ? '50%' : '100%'}
        </span>
      </button>
    </>
  )
}

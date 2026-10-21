/**
 * Lecteur playlist externe (SoundCloud / YouTube).
 * Un seul iframe dans le DOM : réduire / agrandir ne change que le conteneur CSS.
 * Mini-player ≥ 200×200, contrôles natifs YT, stop = démontage, lien YouTube permanent.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_PLAYLIST,
  PLAYLIST_MODAL_EVENT,
  buildEmbedSrc,
  buildYoutubeOpenUrl,
  isMusicEnabled,
  setMusicEnabled,
} from '../config/playlist'

export default function PlaylistPlayerModal() {
  const [modalOpen, setModalOpen] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [needsGesture, setNeedsGesture] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const cfg = DEFAULT_PLAYLIST

  const embedSrc = useMemo(
    () => (enabled ? buildEmbedSrc(cfg, true) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled],
  )

  const youtubeUrl = useMemo(() => buildYoutubeOpenUrl(cfg), [cfg])

  useEffect(() => {
    setEnabled(isMusicEnabled())
    const onMusic = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d && typeof d.enabled === 'boolean') setEnabled(d.enabled)
    }
    const onModal = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d && typeof d.open === 'boolean') setModalOpen(d.open)
    }
    window.addEventListener('xartists-music', onMusic)
    window.addEventListener(PLAYLIST_MODAL_EVENT, onModal)
    return () => {
      window.removeEventListener('xartists-music', onMusic)
      window.removeEventListener(PLAYLIST_MODAL_EVENT, onModal)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setNeedsGesture(false)
      return
    }
    const t = window.setTimeout(() => {
      if (window.matchMedia('(pointer: coarse)').matches) setNeedsGesture(true)
    }, 1200)
    return () => window.clearTimeout(t)
  }, [enabled, embedSrc])

  const stopMusic = () => {
    setMusicEnabled(false)
    setEnabled(false)
    setModalOpen(false)
    setNeedsGesture(false)
  }

  const togglePlay = () => {
    if (enabled) {
      stopMusic()
      return
    }
    setMusicEnabled(true)
    setEnabled(true)
    setModalOpen(true)
  }

  const startManual = () => {
    setNeedsGesture(false)
    const el = iframeRef.current
    if (el && embedSrc) el.src = embedSrc
  }

  return (
    <>
      {enabled && embedSrc && (
        <div
          className={
            modalOpen
              ? 'fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-3'
              : 'fixed bottom-28 right-3 z-[45] pointer-events-auto'
          }
          onClick={modalOpen ? () => setModalOpen(false) : undefined}
          role={modalOpen ? 'presentation' : undefined}
        >
          <div
            className={
              modalOpen
                ? 'glass-hud w-full max-w-lg overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.25)] flex flex-col'
                : 'relative w-[min(220px,42vw)] min-w-[200px] min-h-[200px] aspect-square rounded-xl overflow-hidden border border-violet-400/30 shadow-[0_0_24px_rgba(139,92,246,0.35)] bg-black'
            }
            onClick={modalOpen ? e => e.stopPropagation() : undefined}
            role={modalOpen ? 'dialog' : undefined}
            aria-modal={modalOpen || undefined}
            aria-label={modalOpen ? 'Playlist musique' : undefined}
          >
            {modalOpen && (
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
                <div>
                  <p className="text-[10px] font-tech uppercase tracking-widest text-violet-300/90">
                    Playlist · {cfg.provider}
                  </p>
                  <p className="text-sm font-semibold text-white">{cfg.label}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-[11px] px-2 py-1"
                  >
                    Ouvrir sur YouTube
                  </a>
                  <button
                    type="button"
                    className="btn-secondary text-[11px] px-2 py-1"
                    onClick={() => setModalOpen(false)}
                  >
                    Réduire
                  </button>
                </div>
              </div>
            )}

            <div
              className={
                modalOpen
                  ? 'relative bg-black aspect-video w-full min-h-[200px]'
                  : 'relative w-full h-full min-h-[200px] min-w-[200px]'
              }
            >
              <iframe
                ref={iframeRef}
                title="playlist"
                src={embedSrc}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
              {needsGesture && (
                <button
                  type="button"
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 text-sm font-semibold text-white"
                  onClick={startManual}
                >
                  ▶ {modalOpen ? 'Lancer la lecture' : 'Lancer'}
                </button>
              )}
              {!modalOpen && (
                <>
                  <div className="absolute top-1 right-1 z-10 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-violet-100 border border-violet-400/40"
                    >
                      Agrandir
                    </button>
                    <button
                      type="button"
                      onClick={stopMusic}
                      className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-zinc-200 border border-white/20"
                    >
                      Stop
                    </button>
                  </div>
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-1 left-1 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-violet-200 border border-violet-400/30"
                  >
                    YouTube ↗
                  </a>
                </>
              )}
            </div>

            {modalOpen && (
              <>
                <p className="px-4 py-2 text-[10px] text-zinc-500">
                  Lecture externe · réduire garde le son · volume/pause via contrôles YouTube
                </p>
                <div className="px-4 pb-4 flex gap-2">
                  <button type="button" className="btn-secondary flex-1 text-sm" onClick={stopMusic}>
                    Arrêter
                  </button>
                  <button
                    type="button"
                    className="btn-primary flex-1 text-sm"
                    onClick={() => setModalOpen(false)}
                  >
                    Continuer en fond
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-24 md:bottom-24 right-3 z-40 flex flex-col gap-2 items-end pointer-events-auto">
        {enabled && !modalOpen && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full border border-violet-400/35 bg-violet-950/80 backdrop-blur-md px-3 py-1.5 text-[10px] font-medium text-violet-100 shadow-lg"
          >
            Ouvrir player
          </button>
        )}
        <button
          type="button"
          onClick={togglePlay}
          className={`rounded-full border backdrop-blur-md px-3 py-2 text-[11px] font-medium shadow-lg transition-all ${
            enabled
              ? 'border-violet-400/40 bg-violet-600/30 text-violet-50'
              : 'border-white/15 bg-black/70 text-zinc-200 hover:border-violet-400/30'
          }`}
          title={enabled ? 'Musique on — clic pour arrêter' : 'Activer musique'}
        >
          {enabled ? '🎵 Musique' : '🎵 Activer'}
        </button>
      </div>
    </>
  )
}

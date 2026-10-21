/**
 * Lecteur playlist externe (SoundCloud / YouTube).
 * Un seul iframe dans le DOM (key stable) :
 * - Cacher le lecteur : musique continue, iframe montée, URL inchangée.
 * - Arrêter la musique : démonte l’iframe (enabled → false).
 * - Pas de grande miniature permanente sur mobile.
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
  /** Cacher : musique continue, iframe reste montée, URL stable */
  const [isHidden, setIsHidden] = useState(false)
  const [needsGesture, setNeedsGesture] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const cfg = DEFAULT_PLAYLIST

  // embedSrc change UNIQUEMENT quand enabled change — pas sur hide/show
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
      if (d && typeof d.enabled === 'boolean') {
        setEnabled(d.enabled)
        if (!d.enabled) {
          setIsHidden(false)
          setModalOpen(false)
        }
      }
    }
    const onModal = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d && typeof d.open === 'boolean') {
        setModalOpen(d.open)
        if (d.open) setIsHidden(false)
      }
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

  /** Arrêt réel : démonte l’iframe */
  const stopMusic = () => {
    setMusicEnabled(false)
    setEnabled(false)
    setModalOpen(false)
    setIsHidden(false)
    setNeedsGesture(false)
  }

  const hidePlayer = () => {
    setIsHidden(true)
    setModalOpen(false)
  }

  const showPlayer = () => {
    setIsHidden(false)
    setModalOpen(true)
  }

  const togglePlay = () => {
    if (enabled) {
      stopMusic()
      return
    }
    setMusicEnabled(true)
    setEnabled(true)
    setIsHidden(false)
    setModalOpen(true)
  }

  const startManual = () => {
    setNeedsGesture(false)
    const el = iframeRef.current
    if (el && embedSrc) el.src = embedSrc
  }

  return (
    <>
      {/* Iframe unique — montée tant que enabled. Visibilité CSS uniquement. */}
      {enabled && embedSrc && (
        <div
          className={
            isHidden
              ? 'fixed w-px h-px overflow-hidden opacity-0 pointer-events-none -left-[9999px] top-0 -z-50'
              : modalOpen
                ? 'fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-3'
                : 'fixed bottom-28 right-3 z-[45] pointer-events-auto max-sm:hidden'
          }
          onClick={modalOpen && !isHidden ? () => setModalOpen(false) : undefined}
          role={modalOpen && !isHidden ? 'presentation' : undefined}
        >
          <div
            className={
              isHidden
                ? 'w-px h-px'
                : modalOpen
                  ? 'glass-hud w-full max-w-lg overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.25)] flex flex-col'
                  : 'relative w-[min(220px,42vw)] min-w-[200px] min-h-[200px] aspect-square rounded-xl overflow-hidden border border-violet-400/30 shadow-[0_0_24px_rgba(139,92,246,0.35)] bg-black'
            }
            onClick={modalOpen && !isHidden ? e => e.stopPropagation() : undefined}
            role={modalOpen && !isHidden ? 'dialog' : undefined}
            aria-modal={modalOpen && !isHidden ? true : undefined}
            aria-label={modalOpen && !isHidden ? 'Playlist musique' : undefined}
            aria-hidden={isHidden}
          >
            {modalOpen && !isHidden && (
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
                <div>
                  <p className="text-[10px] font-tech uppercase tracking-widest text-violet-300/90">
                    Playlist · {cfg.provider}
                  </p>
                  <p className="text-sm font-semibold text-white">{cfg.label}</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
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
                    onClick={hidePlayer}
                  >
                    Cacher le lecteur
                  </button>
                </div>
              </div>
            )}

            <div
              className={
                isHidden
                  ? 'w-px h-px'
                  : modalOpen
                    ? 'relative bg-black aspect-video w-full min-h-[200px]'
                    : 'relative w-full h-full min-h-[200px] min-w-[200px]'
              }
            >
              <iframe
                ref={iframeRef}
                key="xa-playlist-iframe"
                title="playlist"
                src={embedSrc}
                className={isHidden ? 'w-px h-px border-0' : 'absolute inset-0 w-full h-full border-0'}
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
              {needsGesture && !isHidden && (
                <button
                  type="button"
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 text-sm font-semibold text-white"
                  onClick={startManual}
                >
                  ▶ {modalOpen ? 'Lancer la lecture' : 'Lancer'}
                </button>
              )}
              {!modalOpen && !isHidden && (
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
                      onClick={hidePlayer}
                      className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-zinc-200 border border-white/20"
                    >
                      Cacher
                    </button>
                    <button
                      type="button"
                      onClick={stopMusic}
                      className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-zinc-200 border border-white/20"
                    >
                      Arrêter
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

            {modalOpen && !isHidden && (
              <>
                <p className="px-4 py-2 text-[10px] text-zinc-500">
                  Lecture externe · Cacher garde le son · Arrêter démonte le lecteur
                </p>
                <div className="px-4 pb-4 flex gap-2">
                  <button type="button" className="btn-secondary flex-1 text-sm" onClick={stopMusic}>
                    Arrêter la musique
                  </button>
                  <button
                    type="button"
                    className="btn-primary flex-1 text-sm"
                    onClick={hidePlayer}
                  >
                    Cacher le lecteur
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Boutons flottants toujours accessibles */}
      <div className="fixed bottom-24 md:bottom-24 right-3 z-40 flex flex-col gap-2 items-end pointer-events-auto">
        {enabled && isHidden && (
          <button
            type="button"
            onClick={showPlayer}
            className="rounded-full border border-violet-400/35 bg-violet-950/80 backdrop-blur-md px-3 py-1.5 text-[10px] font-medium text-violet-100 shadow-lg"
            title="Réouvrir le lecteur (musique en cours)"
          >
            🎵 Lecteur
          </button>
        )}
        {enabled && !isHidden && !modalOpen && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full border border-violet-400/35 bg-violet-950/80 backdrop-blur-md px-3 py-1.5 text-[10px] font-medium text-violet-100 shadow-lg sm:hidden"
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

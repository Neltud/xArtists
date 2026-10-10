/**
 * Lecteur playlist externe (SoundCloud / YouTube).
 * Modal glass — fermer la modal garde la lecture en arrière-plan (iframe masquée).
 * FAB ancré bottom: 96px (bottom-24) au-dessus BottomBar, hors zone News / LIA.
 */
import { useEffect, useState } from 'react'
import {
  DEFAULT_PLAYLIST,
  PLAYLIST_MODAL_EVENT,
  buildEmbedSrc,
  isMusicEnabled,
  setMusicEnabled,
  openPlaylistModal,
} from '../config/playlist'

export default function PlaylistPlayerModal() {
  const [modalOpen, setModalOpen] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [muted, setMuted] = useState(false)
  const cfg = DEFAULT_PLAYLIST

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

  const togglePlay = () => {
    const next = !enabled
    setMusicEnabled(next)
    setEnabled(next)
    if (next) setModalOpen(true)
  }

  const embedSrc = enabled ? buildEmbedSrc(cfg, true) : ''

  return (
    <>
      {enabled && embedSrc && (
        <div
          className={
            modalOpen
              ? 'fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-3'
              : 'fixed bottom-0 left-0 w-[1px] h-[1px] overflow-hidden opacity-0 pointer-events-none z-0'
          }
          onClick={modalOpen ? () => setModalOpen(false) : undefined}
          role={modalOpen ? 'presentation' : undefined}
        >
          {modalOpen ? (
            <div
              className="glass-hud w-full max-w-lg overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.25)]"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal
              aria-label="Playlist musique"
            >
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
                <div>
                  <p className="text-[10px] font-tech uppercase tracking-widest text-violet-300/90">
                    Playlist · {cfg.provider}
                  </p>
                  <p className="text-sm font-semibold text-white">{cfg.label}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary text-[11px] px-2 py-1"
                    onClick={() => setMuted(m => !m)}
                  >
                    {muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-[11px] px-2 py-1"
                    onClick={() => setModalOpen(false)}
                  >
                    Fermer
                  </button>
                </div>
              </div>
              <div className="relative bg-black aspect-video w-full">
                <iframe
                  title="playlist"
                  src={muted ? embedSrc.replace('auto_play=true', 'auto_play=false') : embedSrc}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="autoplay; encrypted-media"
                  loading="lazy"
                />
                {muted && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-white/80 font-tech">MUET (UI)</span>
                  </div>
                )}
              </div>
              <p className="px-4 py-2 text-[10px] text-zinc-500">
                Lecture externe · fermer garde le son en fond si activé
              </p>
              <div className="px-4 pb-4 flex gap-2">
                <button type="button" className="btn-secondary flex-1 text-sm" onClick={togglePlay}>
                  Stop musique
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1 text-sm"
                  onClick={() => setModalOpen(false)}
                >
                  Continuer en fond
                </button>
              </div>
            </div>
          ) : (
            <iframe
              title="playlist-bg"
              src={embedSrc}
              className="w-[320px] h-[180px] border-0"
              allow="autoplay; encrypted-media"
            />
          )}
        </div>
      )}

      <div className="fixed bottom-24 md:bottom-24 right-3 z-40 flex flex-col gap-2 items-end pointer-events-auto">
        {enabled && (
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
          title={enabled ? 'Musique on — clic pour stop' : 'Activer musique'}
        >
          {enabled ? '🎵 Musique' : '🎵 Activer'}
        </button>
      </div>
    </>
  )
}

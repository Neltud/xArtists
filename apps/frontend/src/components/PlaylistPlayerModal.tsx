/**
 * Un seul iframe : « Cacher » conserve le lecteur monté et son URL.
 * Seul « Arrêter » désactive la musique et démonte le lecteur.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DEFAULT_PLAYLIST,
  PLAYLIST_MODAL_EVENT,
  buildEmbedSrc,
  buildYoutubeOpenUrl,
  isMusicEnabled,
  setMusicEnabled,
} from '../config/playlist'

export default function PlaylistPlayerModal() {
  const [visible, setVisible] = useState(false)
  const [enabled, setEnabled] = useState(isMusicEnabled)
  const hideButton = useRef<HTMLButtonElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const cfg = DEFAULT_PLAYLIST
  const providerName = cfg.provider === 'youtube' ? 'YouTube' : 'SoundCloud'
  const externalUrl = cfg.provider === 'youtube' ? buildYoutubeOpenUrl(cfg) : cfg.url

  useEffect(() => {
    const onMusic = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (typeof detail?.enabled === 'boolean') {
        setEnabled(detail.enabled)
        if (!detail.enabled) setVisible(false)
      }
    }
    const onModal = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (typeof detail?.open === 'boolean') {
        if (detail.open) setMusicEnabled(true)
        setVisible(detail.open)
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
    if (!visible || !enabled) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    hideButton.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setVisible(false)
      }
      if (event.key === 'Tab') {
        const controls = hideButton.current?.closest('section')
          ?.querySelectorAll<HTMLElement>('button, iframe, a[href]')
        const first = controls?.[0]
        const last = controls?.[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey, true)
      launcher.current?.focus()
    }
  }, [visible, enabled])

  const show = () => {
    if (!enabled) setMusicEnabled(true)
    setVisible(true)
  }
  const stop = () => {
    setMusicEnabled(false)
    setVisible(false)
  }

  return createPortal(
    <>
      {enabled && (
        <div
          className={visible ? 'music-player-overlay' : 'music-player-background'}
          aria-hidden={!visible || undefined}
          onClick={visible ? () => setVisible(false) : undefined}
        >
          <section
            className="music-player-panel glass-hud w-full overflow-y-auto shadow-xl"
            role="dialog"
            aria-modal={visible || undefined}
            aria-label={cfg.label}
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-[var(--xa-accent)]">
                  Musique · {providerName}
                </p>
                <p className="text-sm font-semibold text-white">{cfg.label}</p>
              </div>
              <button
                ref={hideButton}
                type="button"
                className="btn-secondary shrink-0 text-xs px-3"
                onClick={() => setVisible(false)}
              >
                Cacher le lecteur
              </button>
            </div>
            <div className="music-player-video relative w-full bg-black">
              <iframe
                title={cfg.label}
                src={buildEmbedSrc(cfg, true)}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                tabIndex={visible ? 0 : -1}
              />
            </div>
            <p className="px-3 pt-3 text-xs text-[var(--xa-text-muted)]">
              Cacher le lecteur garde la musique. Pause et volume : commandes {providerName}.
              Si la lecture ne démarre pas, touche ▶ dans le lecteur.
            </p>
            <div className="flex flex-wrap gap-2 p-3">
              <button type="button" className="btn-secondary flex-1 text-xs px-3" onClick={stop}>
                Arrêter la musique
              </button>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 text-xs px-3"
              >
                Ouvrir sur {providerName}
              </a>
            </div>
          </section>
        </div>
      )}
      <button
        ref={launcher}
        type="button"
        className="music-player-toggle rounded-full border border-white/20 bg-black/85 backdrop-blur-md text-lg text-white shadow-lg"
        onClick={show}
        aria-label={enabled ? 'Afficher le lecteur — musique active' : 'Activer les instrumentales de Nelson Tuduri'}
        title={enabled ? 'Afficher le lecteur — musique active' : 'Activer la musique'}
      >
        <span aria-hidden>🎵</span>
        {enabled && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--xa-accent)]" aria-hidden />}
      </button>
    </>,
    document.body,
  )
}

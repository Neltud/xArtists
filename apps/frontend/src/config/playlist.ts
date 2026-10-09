/**
 * Playlist externe — SoundCloud / YouTube (pas de MP3 dans le repo).
 * Override via VITE_PLAYLIST_URL / VITE_PLAYLIST_PROVIDER.
 */

export type PlaylistProvider = 'soundcloud' | 'youtube'

export type PlaylistConfig = {
  provider: PlaylistProvider
  /** URL playlist ou track SoundCloud, ou ID playlist / vidéo YouTube */
  url: string
  label: string
}

const envUrl = (() => {
  try {
    return String(
      (import.meta as { env?: { VITE_PLAYLIST_URL?: string } }).env?.VITE_PLAYLIST_URL || '',
    ).trim()
  } catch {
    return ''
  }
})()

const envProvider = (() => {
  try {
    const p = String(
      (import.meta as { env?: { VITE_PLAYLIST_PROVIDER?: string } }).env?.VITE_PLAYLIST_PROVIDER ||
        '',
    )
      .trim()
      .toLowerCase()
    if (p === 'youtube' || p === 'soundcloud') return p as PlaylistProvider
  } catch {
    /* */
  }
  return null
})()

/** Défaut : lofi girl (YouTube) — ambiance gratuite, personnalisable */
export const DEFAULT_PLAYLIST: PlaylistConfig = {
  provider: envProvider || (envUrl.includes('soundcloud') ? 'soundcloud' : 'youtube'),
  url:
    envUrl ||
    // YouTube lofi hip hop radio (popular public stream)
    'jfKfPfyJRdk',
  label: 'Ambiance · playlist',
}

export const MUSIC_STORAGE_KEY = 'xartists-music-enabled'
export const PLAYLIST_MODAL_EVENT = 'xartists-playlist-modal'

export function isMusicEnabled(): boolean {
  try {
    return localStorage.getItem(MUSIC_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setMusicEnabled(on: boolean): void {
  try {
    localStorage.setItem(MUSIC_STORAGE_KEY, on ? '1' : '0')
  } catch {
    /* */
  }
  window.dispatchEvent(new CustomEvent('xartists-music', { detail: { enabled: on } }))
}

export function openPlaylistModal(): void {
  window.dispatchEvent(new CustomEvent(PLAYLIST_MODAL_EVENT, { detail: { open: true } }))
}

export function closePlaylistModal(): void {
  window.dispatchEvent(new CustomEvent(PLAYLIST_MODAL_EVENT, { detail: { open: false } }))
}

/** Build embed src for iframe */
export function buildEmbedSrc(cfg: PlaylistConfig, autoplay: boolean): string {
  if (cfg.provider === 'soundcloud') {
    const trackUrl = cfg.url.includes('soundcloud.com')
      ? cfg.url
      : `https://api.soundcloud.com/tracks/${cfg.url}`
    const q = new URLSearchParams({
      url: trackUrl,
      color: '#8b5cf6',
      auto_play: autoplay ? 'true' : 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      show_teaser: 'false',
      visual: 'true',
    })
    return `https://w.soundcloud.com/player/?${q.toString()}`
  }

  // YouTube — video id or playlist list=
  const id = cfg.url.replace(/^https?:\/\/(www\.)?youtube\.com\/watch\?v=/, '').replace(/&.*/, '')
  const listMatch = cfg.url.match(/[?&]list=([a-zA-Z0-9_-]+)/)
  if (listMatch) {
    return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}&autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
  }
  if (id.startsWith('PL') || id.startsWith('UU')) {
    return `https://www.youtube.com/embed/videoseries?list=${id}&autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`
  }
  const vid = id.length === 11 ? id : cfg.url.slice(0, 11)
  return `https://www.youtube.com/embed/${vid}?autoplay=${autoplay ? 1 : 0}&loop=1&playlist=${vid}&rel=0&modestbranding=1&playsinline=1`
}

/**
 * Playlist externe — SoundCloud / YouTube (pas de MP3 dans le repo).
 * Override via VITE_PLAYLIST_URL / VITE_PLAYLIST_PROVIDER.
 */

export type PlaylistProvider = 'soundcloud' | 'youtube'

export type PlaylistConfig = {
  provider: PlaylistProvider
  /**
   * YouTube: ID playlist (PL…) ou ID vidéo (11 chars), ou URL complète.
   * SoundCloud: URL track/playlist ou ID.
   */
  url: string
  label: string
  /** true si `url` est un ID / URL de playlist YouTube (listType=playlist) */
  isPlaylist?: boolean
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

/** Nelson Tuduri · Instrumentales (playlist YouTube officielle) */
export const NELSON_PLAYLIST_ID = 'PLgOJTjzDs6ePLXPNu0YE1w-R-iJneJzF3'
export const NELSON_PLAYLIST_LABEL = 'Nelson Tuduri · Instrumentales'

/** Défaut : instrumentales Nelson Tuduri — override env préservé */
export const DEFAULT_PLAYLIST: PlaylistConfig = {
  provider: envProvider || (envUrl.includes('soundcloud') ? 'soundcloud' : 'youtube'),
  url: envUrl || NELSON_PLAYLIST_ID,
  label: envUrl ? 'Ambiance · playlist' : NELSON_PLAYLIST_LABEL,
  isPlaylist: !envUrl || envUrl.includes('list=') || envUrl.startsWith('PL') || envUrl.startsWith('UU'),
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

/** Extrait l'ID playlist YouTube depuis URL ou ID brut (ignore si=…) */
export function extractYoutubePlaylistId(raw: string): string | null {
  const s = (raw || '').trim()
  if (!s) return null
  const listMatch = s.match(/[?&]list=([a-zA-Z0-9_-]+)/)
  if (listMatch) return listMatch[1]
  if (s.startsWith('PL') || s.startsWith('UU') || s.startsWith('OL')) return s.split(/[?&#]/)[0]
  return null
}

/** Extrait l'ID vidéo YouTube (11 chars) */
export function extractYoutubeVideoId(raw: string): string | null {
  const s = (raw || '').trim()
  if (!s) return null
  const watch = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watch) return watch[1]
  const short = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (short) return short[1]
  const embed = s.match(/embed\/([a-zA-Z0-9_-]{11})/)
  if (embed) return embed[1]
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  return null
}

/** URL publique « Ouvrir sur YouTube » */
export function buildYoutubeOpenUrl(cfg: PlaylistConfig): string {
  const listId = extractYoutubePlaylistId(cfg.url)
  if (listId) return `https://www.youtube.com/playlist?list=${listId}`
  const vid = extractYoutubeVideoId(cfg.url)
  if (vid) return `https://www.youtube.com/watch?v=${vid}`
  return 'https://www.youtube.com'
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

  // YouTube — playlist prioritaire (listType=playlist), sinon vidéo
  const listId = extractYoutubePlaylistId(cfg.url)
  if (listId || cfg.isPlaylist) {
    const id = listId || cfg.url.split(/[?&#]/)[0]
    const params = new URLSearchParams({
      list: id,
      listType: 'playlist',
      autoplay: autoplay ? '1' : '0',
      loop: '1',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
    })
    return `https://www.youtube.com/embed/videoseries?${params.toString()}`
  }

  const vid = extractYoutubeVideoId(cfg.url) || cfg.url.slice(0, 11)
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    loop: '1',
    playlist: vid,
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
  })
  return `https://www.youtube.com/embed/${vid}?${params.toString()}`
}

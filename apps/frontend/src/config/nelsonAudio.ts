/**
 * Zone ambience — HTML5 MP3 (no YouTube).
 * Mars → accueil/gallery | Elixir → command/LIA | Persic → musée
 *
 * Place full tracks in public/audio/ (see docs/AUDIO_AMBIENCE.md).
 * Optional overrides: VITE_AUDIO_GALLERY_URL, VITE_AUDIO_COMMAND_URL, VITE_AUDIO_MUSEUM_URL
 */

export type ZoneId = 'gallery' | 'command' | 'museum' | 'default'

export type ZoneTrack = {
  zone: ZoneId
  label: string
  /** path relative to site base, or absolute URL */
  src: string
  volume: number
}

function base() {
  try {
    return String((import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL || '/').replace(/\/?$/, '/')
  } catch {
    return '/'
  }
}

function envUrl(key: string): string {
  try {
    return String((import.meta as { env?: Record<string, string> }).env?.[key] || '').trim()
  } catch {
    return ''
  }
}

export const ZONE_TRACKS: Record<ZoneId, ZoneTrack> = {
  gallery: {
    zone: 'gallery',
    label: 'Mars · Accueil',
    src: envUrl('VITE_AUDIO_GALLERY_URL') || `${base()}audio/mars_gallery.mp3`,
    volume: 0.55,
  },
  command: {
    zone: 'command',
    label: 'Elixir · Command / LIA',
    src: envUrl('VITE_AUDIO_COMMAND_URL') || `${base()}audio/elixir_command.mp3`,
    volume: 0.45,
  },
  museum: {
    zone: 'museum',
    label: 'Persic · Musée',
    src: envUrl('VITE_AUDIO_MUSEUM_URL') || `${base()}audio/persic_museum.mp3`,
    volume: 0.5,
  },
  default: {
    zone: 'default',
    label: 'Mars · Ambiance',
    src: envUrl('VITE_AUDIO_GALLERY_URL') || `${base()}audio/mars_gallery.mp3`,
    volume: 0.4,
  },
}

/** Map pathname → zone */
export function zoneFromPath(pathname: string): ZoneId {
  const p = (pathname || '/').replace(/\/+$/, '') || '/'
  if (p === '/' || p === '') return 'gallery'
  if (p.includes('command') || p.includes('lia') || p.includes('trading')) return 'command'
  if (p.includes('museum') || p.includes('gallery') || p.includes('venue') || p.includes('tours'))
    return 'museum'
  if (p.includes('tca') || p.includes('classroom')) return 'gallery'
  return 'default'
}

export const MUSIC_STORAGE_KEY = 'xartists-music-enabled'

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

/** @deprecated YouTube removed — kept for type compat */
export type NelsonTrack = { id: string; label: string; youtubeId: string; category?: string }
export const NELSON_DEFAULT_TRACK: NelsonTrack = {
  id: 'mp3',
  label: 'Zone ambience',
  youtubeId: '',
  category: 'ambient',
}
export const NELSON_TRACKS: NelsonTrack[] = [NELSON_DEFAULT_TRACK]
export const ZONE_VOLUME = { museum: 1, command: 0.2, transition: 0.5, casino: 0.55 } as const

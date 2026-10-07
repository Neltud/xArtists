/**
 * Zone ambience — HTML5 MP3 (no YouTube).
 * Prefer public/audio/*.mp3 ; else embedded 25s loops.
 */
import { EMBED_MARS } from '../assets/audio/embed_mars'
import { EMBED_ELIXIR } from '../assets/audio/embed_elixir'
import { EMBED_PERSIC } from '../assets/audio/embed_persic'

export type ZoneId = 'gallery' | 'command' | 'museum' | 'default'

export type ZoneTrack = {
  zone: ZoneId
  label: string
  /** primary path (site) */
  src: string
  /** data-url fallback if primary 404 */
  fallback: string
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
    fallback: EMBED_MARS,
    volume: 0.55,
  },
  command: {
    zone: 'command',
    label: 'Elixir · Command / LIA',
    src: envUrl('VITE_AUDIO_COMMAND_URL') || `${base()}audio/elixir_command.mp3`,
    fallback: EMBED_ELIXIR,
    volume: 0.45,
  },
  museum: {
    zone: 'museum',
    label: 'Persic · Musée / TCA',
    src: envUrl('VITE_AUDIO_MUSEUM_URL') || `${base()}audio/persic_museum.mp3`,
    fallback: EMBED_PERSIC,
    volume: 0.5,
  },
  default: {
    zone: 'default',
    label: 'Mars · Ambiance',
    src: envUrl('VITE_AUDIO_GALLERY_URL') || `${base()}audio/mars_gallery.mp3`,
    fallback: EMBED_MARS,
    volume: 0.4,
  },
}

export function zoneFromPath(pathname: string): ZoneId {
  const p = (pathname || '/').replace(/\/+$/, '') || '/'
  if (p === '/' || p === '') return 'gallery'
  if (p.includes('command') || p.includes('lia') || p.includes('trading') || p.includes('cc'))
    return 'command'
  if (
    p.includes('museum') ||
    p.includes('gallery') ||
    p.includes('venue') ||
    p.includes('tours') ||
    p.includes('tca') ||
    p.includes('classroom') ||
    p.includes('my-packs') ||
    p.includes('salles')
  )
    return 'museum'
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

/** @deprecated YouTube removed */
export type NelsonTrack = { id: string; label: string; youtubeId: string; category?: string }
export const NELSON_DEFAULT_TRACK: NelsonTrack = {
  id: 'mp3',
  label: 'Zone ambience',
  youtubeId: '',
  category: 'ambient',
}
export const NELSON_TRACKS: NelsonTrack[] = [NELSON_DEFAULT_TRACK]
export const ZONE_VOLUME = { museum: 1, command: 0.2, transition: 0.5, casino: 0.55 } as const

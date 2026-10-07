/**
 * Zone ambience — HTML5 (no YouTube).
 * 1) public/audio/*.mp3  2) public/audio/*.b64 → data URL  3) silent
 */

export type ZoneId = 'gallery' | 'command' | 'museum' | 'default'

export type ZoneTrack = {
  zone: ZoneId
  label: string
  src: string
  b64Path: string
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
    b64Path: `${base()}audio/mars_gallery.b64`,
    volume: 0.55,
  },
  command: {
    zone: 'command',
    label: 'Elixir · Command / LIA',
    src: envUrl('VITE_AUDIO_COMMAND_URL') || `${base()}audio/elixir_command.mp3`,
    b64Path: `${base()}audio/elixir_command.b64`,
    volume: 0.45,
  },
  museum: {
    zone: 'museum',
    label: 'Persic · Musée / TCA',
    src: envUrl('VITE_AUDIO_MUSEUM_URL') || `${base()}audio/persic_museum.mp3`,
    b64Path: `${base()}audio/persic_museum.b64`,
    volume: 0.5,
  },
  default: {
    zone: 'default',
    label: 'Mars · Ambiance',
    src: envUrl('VITE_AUDIO_GALLERY_URL') || `${base()}audio/mars_gallery.mp3`,
    b64Path: `${base()}audio/mars_gallery.b64`,
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

/** Resolve playable src: mp3 → b64 data-url → null */
export async function resolveTrackSrc(track: ZoneTrack): Promise<string | null> {
  try {
    const r = await fetch(track.src, { method: 'HEAD', cache: 'no-store' })
    if (r.ok) return track.src
  } catch {
    /* */
  }
  try {
    const r = await fetch(track.b64Path, { cache: 'force-cache' })
    if (r.ok) {
      const b64 = (await r.text()).trim()
      if (b64.length > 100 && !b64.startsWith('PLACEHOLDER')) {
        return `data:audio/mpeg;base64,${b64}`
      }
    }
  } catch {
    /* */
  }
  return null
}

export type NelsonTrack = { id: string; label: string; youtubeId: string; category?: string }
export const NELSON_DEFAULT_TRACK: NelsonTrack = {
  id: 'mp3',
  label: 'Zone ambience',
  youtubeId: '',
  category: 'ambient',
}
export const NELSON_TRACKS: NelsonTrack[] = [NELSON_DEFAULT_TRACK]
export const ZONE_VOLUME = { museum: 1, command: 0.2, transition: 0.5, casino: 0.55 } as const

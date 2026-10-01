/**
 * Nelson Tuduri + zone audio.
 * Ambient = YouTube (léger, pas de gros MP3 dans le repo).
 * SFX slot = Web Audio (useFuturisticSounds) — zéro fichier.
 *
 * MP3 optionnel plus tard :
 *  - public/audio/*.mp3 dans le repo (GitHub Pages, < ~3 Mo recommandé)
 *  - ou CDN / Akash static URL via VITE_CASINO_MP3_URL
 */

export type NelsonTrack = {
  id: string
  label: string
  youtubeId: string
  category?: 'ambient' | 'casino'
}

const envId = (() => {
  try {
    return String(
      (import.meta as { env?: { VITE_NELSON_YOUTUBE_ID?: string } }).env?.VITE_NELSON_YOUTUBE_ID ||
        '',
    ).trim()
  } catch {
    return ''
  }
})()

/** lofi / ambient art — replace via VITE_NELSON_YOUTUBE_ID */
export const NELSON_TRACKS: NelsonTrack[] = [
  {
    id: 'main',
    label: 'Nelson Tuduri · ambiance',
    youtubeId: envId || 'jfKfPfyJRdk',
    category: 'ambient',
  },
]

export const NELSON_DEFAULT_TRACK = NELSON_TRACKS[0]

/** Zone target volumes (0–1) */
export const ZONE_VOLUME = {
  museum: 1,
  command: 0.2,
  transition: 0.5,
  /** Slot page — légèrement plus bas pour laisser place aux SFX */
  casino: 0.55,
} as const

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

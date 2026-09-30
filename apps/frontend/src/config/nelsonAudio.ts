/**
 * Nelson Tuduri soundscapes — configurable YouTube IDs.
 * Override via VITE_NELSON_YOUTUBE_ID (single) or leave defaults.
 * Mute-by-default until user gesture (autoplay policy).
 */

export type NelsonTrack = {
  id: string
  label: string
  youtubeId: string
}

const envId = (() => {
  try {
    return String(
      (import.meta as { env?: { VITE_NELSON_YOUTUBE_ID?: string } }).env?.VITE_NELSON_YOUTUBE_ID || '',
    ).trim()
  } catch {
    return ''
  }
})()

/** Placeholder ambient art track — replace with official Nelson Tuduri ID in ops secrets / env */
export const NELSON_TRACKS: NelsonTrack[] = [
  {
    id: 'main',
    label: 'Nelson Tuduri · ambiance',
    youtubeId: envId || 'jfKfPfyJRdk',
  },
]

export const NELSON_DEFAULT_TRACK = NELSON_TRACKS[0]

/** Zone target volumes (0–1) */
export const ZONE_VOLUME = {
  museum: 1,
  command: 0.2,
  transition: 0.5,
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

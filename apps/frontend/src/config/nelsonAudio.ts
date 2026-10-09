/**
 * Compat — audio basculé sur config/playlist.ts (SoundCloud / YouTube embed).
 * Conservé pour imports legacy (ZONE_VOLUME, music toggle).
 */
export {
  isMusicEnabled,
  setMusicEnabled,
  MUSIC_STORAGE_KEY,
} from './playlist'

export type NelsonTrack = {
  id: string
  label: string
  youtubeId: string
  category?: 'ambient' | 'casino'
}

export const NELSON_TRACKS: NelsonTrack[] = [
  {
    id: 'main',
    label: 'Ambiance playlist',
    youtubeId: 'jfKfPfyJRdk',
    category: 'ambient',
  },
]

export const NELSON_DEFAULT_TRACK = NELSON_TRACKS[0]

export const ZONE_VOLUME = {
  museum: 1,
  command: 0.2,
  transition: 0.5,
  casino: 0.55,
} as const

/**
 * Compat — audio basculé sur config/playlist.ts (SoundCloud / YouTube embed).
 * Conservé pour imports legacy (ZONE_VOLUME, music toggle).
 * Distingue ID playlist (PL…) et ID vidéo (11 chars).
 */
export {
  isMusicEnabled,
  setMusicEnabled,
  MUSIC_STORAGE_KEY,
  NELSON_PLAYLIST_ID,
  NELSON_PLAYLIST_LABEL,
  extractYoutubePlaylistId,
  extractYoutubeVideoId,
} from './playlist'

export type NelsonTrack = {
  id: string
  label: string
  /** ID vidéo YouTube (11 chars) — lecture single track */
  youtubeId?: string
  /** ID playlist YouTube (PL…) — lecture playlist */
  playlistId?: string
  category?: 'ambient' | 'casino'
}

export const NELSON_TRACKS: NelsonTrack[] = [
  {
    id: 'main',
    label: 'Nelson Tuduri · Instrumentales',
    playlistId: 'PLgOJTjzDs6ePLXPNu0YE1w-R-iJneJzF3',
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

/**
 * Zone ambience player — HTML5 MP3 (Mars / Elixir / Persic).
 * No YouTube iframe. Toggle = Musique button.
 */
import { useGalleryAudio } from '../hooks/useGalleryAudio'

export default function BackgroundMusicPlayer() {
  const { enabled, ready, toggle, label, zone } = useGalleryAudio()

  return (
    <button
      type="button"
      onClick={toggle}
      className={`fixed bottom-[4.5rem] md:bottom-10 right-[4.75rem] z-50 rounded-full border backdrop-blur-md px-3 py-2 text-[11px] font-medium shadow-lg transition-all ${
        enabled
          ? 'border-violet-400/40 bg-violet-950/70 text-white'
          : 'border-amber-400/50 bg-amber-950/80 text-amber-100 animate-pulse'
      }`}
      title={enabled ? `Couper · ${label}` : 'Activer musique d’ambiance'}
      aria-pressed={enabled}
    >
      {enabled ? (ready ? `🎵 ${zone}` : '🎵 …') : '🎵 Musique'}
    </button>
  )
}

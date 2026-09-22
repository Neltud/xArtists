/**
 * Dock son — muet par défaut · futuriste · discret.
 */
import { useEffect, useState } from 'react'
import { isSfxMuted, setSfxMuted, unlockAudio, playUiSound } from '../hooks/useFuturisticSounds'

export default function SoundDock() {
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    setMuted(isSfxMuted())
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d && typeof d.muted === 'boolean') setMuted(d.muted)
    }
    window.addEventListener('xartists-sfx', on)
    return () => window.removeEventListener('xartists-sfx', on)
  }, [])

  const toggle = () => {
    unlockAudio()
    const next = !muted
    setSfxMuted(next)
    setMuted(next)
    if (!next) playUiSound('notify')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-[4.5rem] md:bottom-10 right-3 z-50 rounded-full border border-white/15 bg-black/70 backdrop-blur-md px-3 py-2 text-[11px] font-medium text-zinc-300 shadow-lg hover:border-cyan-400/40 hover:text-white transition-all card-play"
      title={muted ? 'Activer les sons UI' : 'Couper les sons'}
      aria-pressed={!muted}
    >
      {muted ? '🔇 SFX off' : '🔊 SFX on'}
    </button>
  )
}

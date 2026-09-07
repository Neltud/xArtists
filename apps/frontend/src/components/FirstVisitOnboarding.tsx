/**
 * Onboarding first visit — court, honnête, orienté démo.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LINKS } from '../config/links'

const KEY = 'xartists_onboard_v2_done'

export default function FirstVisitOnboarding() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') return
      setOpen(true)
    } catch {
      /* private mode */
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboard-title"
    >
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Bienvenue</p>
        <h2 id="onboard-title" className="text-xl font-semibold text-white tracking-tight mb-2">
          xArtists en 30 secondes
        </h2>
        <p className="text-[13px] text-zinc-400 leading-relaxed mb-4">
          Démo paper sur MultiversX. Explore librement — aucun fonds n’est géré pour toi.
        </p>
        <ul className="space-y-2.5 text-[13px] text-zinc-300 mb-5">
          <li className="flex gap-2">
            <span className="text-violet-400 shrink-0">1</span>
            <span>
              <strong className="text-white">Galerie</strong> — salles 3D & collection
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 shrink-0">2</span>
            <span>
              <strong className="text-white">Packs</strong> — Pulse · Yield · Sentinel uniquement
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 shrink-0">3</span>
            <span>
              <strong className="text-white">Tours</strong> — carte culture (pas un pack IA)
            </span>
          </li>
        </ul>
        <div className="flex flex-wrap gap-2 mb-3">
          <Link to="/museum" onClick={dismiss} className="btn-primary text-sm">
            Ouvrir la galerie
          </Link>
          <Link to="/agents" onClick={dismiss} className="btn-secondary text-sm">
            Packs
          </Link>
          <a
            href={LINKS.discord}
            target="_blank"
            rel="noreferrer"
            onClick={dismiss}
            className="btn-secondary text-sm"
          >
            Discord
          </a>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="w-full text-center text-[11px] text-zinc-600 hover:text-zinc-400 py-2"
        >
          Continuer sans guide
        </button>
      </div>
    </div>
  )
}

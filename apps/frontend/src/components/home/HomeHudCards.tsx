/** 3 cartes HUD — Galerie · LIA Hub · TCA Academy */
import { Link } from 'react-router-dom'

const CARDS = [
  {
    to: '/museum',
    emoji: '🏛️',
    title: 'Galerie & Dôme 3D',
    blurb: 'Entrée directe dans la scène d’exposition WebGL.',
    accent: 'border-amber-500/35 hover:border-amber-400/50',
  },
  {
    to: '/lia',
    emoji: '🤖',
    title: 'LIA Hub (Command Center)',
    blurb: 'Salle de contrôle réservée aux holders de Packs Agent NFT.',
    accent: 'border-cyan-500/35 hover:border-cyan-400/50',
  },
  {
    to: '/tca',
    emoji: '🎓',
    title: 'TCA Academy',
    blurb: 'Module 1 Sfumato & certification Zero-Trust.',
    accent: 'border-violet-500/35 hover:border-violet-400/50',
  },
] as const

export default function HomeHudCards() {
  return (
    <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
      {CARDS.map(c => (
        <Link
          key={c.to}
          to={c.to}
          className={`group rounded-2xl border bg-black/40 backdrop-blur-md p-4 shadow-2xl transition active:scale-[0.98] ${c.accent}`}
        >
          <p className="text-2xl mb-2" aria-hidden>
            {c.emoji}
          </p>
          <h2 className="text-sm font-semibold text-white group-hover:text-violet-100">
            {c.title}
          </h2>
          <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">{c.blurb}</p>
        </Link>
      ))}
    </div>
  )
}

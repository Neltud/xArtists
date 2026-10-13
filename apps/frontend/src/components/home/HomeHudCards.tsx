/** 3 cartes HUD — contraste fort + repères géométriques sur dôme */
import { Link } from 'react-router-dom'

const CARDS = [
  {
    to: '/museum',
    emoji: '🏛️',
    title: 'Galerie & Dôme 3D',
    blurb: 'Entrée directe dans la scène d’exposition WebGL.',
    accent: 'border-amber-500/50 hover:border-amber-400/70',
    glow: 'shadow-[0_0_24px_rgba(251,191,36,0.12)]',
  },
  {
    to: '/lia',
    emoji: '🤖',
    title: 'LIA Hub (Command Center)',
    blurb: 'Salle de contrôle réservée aux holders de Packs Agent NFT.',
    accent: 'border-cyan-500/50 hover:border-cyan-400/70',
    glow: 'shadow-[0_0_24px_rgba(34,211,238,0.12)]',
  },
  {
    to: '/tca',
    emoji: '🎓',
    title: 'TCA Academy',
    blurb: 'Module 1 Sfumato & certification Zero-Trust.',
    accent: 'border-violet-500/50 hover:border-violet-400/70',
    glow: 'shadow-[0_0_24px_rgba(167,139,250,0.12)]',
  },
] as const

export default function HomeHudCards() {
  return (
    <div className="relative w-full max-w-3xl">
      {/* Repères HUD */}
      <div
        className="pointer-events-none absolute -inset-3 rounded-3xl border border-purple-500/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-0 top-1/2 h-px w-6 -translate-y-1/2 -translate-x-full bg-gradient-to-l from-purple-400/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-1/2 h-px w-6 -translate-y-1/2 translate-x-full bg-gradient-to-r from-purple-400/50 to-transparent"
        aria-hidden
      />

      <div className="grid gap-3 sm:grid-cols-3 animate-[fadeIn_0.6s_ease-out]">
        {CARDS.map((c, i) => (
          <Link
            key={c.to}
            to={c.to}
            style={{ animationDelay: `${120 + i * 90}ms` }}
            className={`group relative rounded-2xl border bg-black/75 backdrop-blur-xl p-4 shadow-2xl transition active:scale-[0.98] ${c.accent} ${c.glow}`}
          >
            <span
              className="pointer-events-none absolute left-2 top-2 h-2 w-2 border-l border-t border-white/30"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 border-b border-r border-white/30"
              aria-hidden
            />
            <p className="text-2xl mb-2" aria-hidden>
              {c.emoji}
            </p>
            <h2 className="text-sm font-semibold text-white group-hover:text-violet-100">
              {c.title}
            </h2>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-300">{c.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

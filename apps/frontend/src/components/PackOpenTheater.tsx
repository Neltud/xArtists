/**
 * Ouverture pack — shake → burst → reveal + Lottie check.
 */
import { useEffect, useState } from 'react'
import type { AgentPackProfile } from '../config/agentPacks'
import LottieIcon from './LottieIcon'
import { Link } from 'react-router-dom'

type Phase = 'idle' | 'shake' | 'burst' | 'reveal' | 'done'

export default function PackOpenTheater({
  pack,
  open,
  onClose,
}: {
  pack: AgentPackProfile
  open: boolean
  onClose: () => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    if (!open) {
      setPhase('idle')
      return
    }
    setPhase('shake')
    const t1 = window.setTimeout(() => setPhase('burst'), 700)
    const t2 = window.setTimeout(() => setPhase('reveal'), 1400)
    const t3 = window.setTimeout(() => setPhase('done'), 2200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [open, pack.id])

  if (!open) return null

  const glow =
    pack.id === 'pulse'
      ? 'rgba(52,211,153,0.55)'
      : pack.id === 'yield'
        ? 'rgba(45,212,191,0.55)'
        : 'rgba(56,189,248,0.55)'

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pack-open-title"
    >
      <div className="relative w-full max-w-sm">
        <div
          className={`mx-auto w-40 h-48 rounded-2xl border border-white/20 bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-2xl flex items-center justify-center transition-all duration-500 ${
            phase === 'shake' ? 'animate-pulse scale-105' : ''
          } ${phase === 'burst' || phase === 'reveal' || phase === 'done' ? 'scale-75 opacity-40' : ''}`}
          style={{
            boxShadow: `0 0 60px ${glow}`,
            transform:
              phase === 'shake'
                ? 'rotate(-3deg)'
                : phase === 'burst'
                  ? 'scale(1.2) rotate(6deg)'
                  : undefined,
          }}
        >
          <span className="text-5xl" aria-hidden>
            {pack.icon}
          </span>
        </div>

        {(phase === 'burst' || phase === 'reveal' || phase === 'done') && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: glow,
                  transform: `rotate(${i * 30}deg) translateY(-${60 + (i % 3) * 20}px)`,
                  opacity: phase === 'burst' ? 1 : 0.35,
                  transition: 'opacity 0.8s',
                }}
              />
            ))}
          </div>
        )}

        {(phase === 'reveal' || phase === 'done') && (
          <div className="mt-6 rounded-2xl border border-white/15 bg-zinc-950/95 p-5 space-y-3 animate-fade-in shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)]">
            <div className="flex items-center gap-3">
              <LottieIcon preset="check" loop={false} size={44} />
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  Pack ouvert · paper
                </p>
                <h2 id="pack-open-title" className="text-xl font-semibold text-white">
                  {pack.icon} {pack.name}
                </h2>
              </div>
            </div>
            <p className="text-sm text-zinc-400">{pack.tagline}</p>
            <ul className="space-y-1.5 pt-1">
              {pack.entitlements.map(e => (
                <li key={e} className="text-[13px] text-zinc-300 flex gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-zinc-600 pt-1">
              Produit d’accès unique · mint on-chain plus tard · pas de mandat de gestion
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 py-2.5 text-sm font-medium text-white"
              >
                Continuer
              </button>
              {pack.id === 'pulse' && (
                <Link
                  to="/museum?tab=pulse"
                  onClick={onClose}
                  className="w-full text-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-sm text-emerald-200 hover:bg-emerald-500/15"
                >
                  Ouvrir salle Pulse
                </Link>
              )}
              <Link
                to="/my-packs"
                onClick={onClose}
                className="w-full text-center text-[12px] text-zinc-500 hover:text-zinc-300"
              >
                Voir My Packs
              </Link>
            </div>
          </div>
        )}

        {phase !== 'reveal' && phase !== 'done' && (
          <p className="text-center text-xs text-zinc-500 mt-6">Ouverture…</p>
        )}
      </div>
    </div>
  )
}

/**
 * Paper Sovereign Identity score — localStorage until on-chain SBT.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { levelFor, loadPaperSoul, type PaperSoul } from '../lib/paperSoul'

export default function PaperSoulScore({ compact = false }: { compact?: boolean }) {
  const [soul, setSoul] = useState<PaperSoul>(() => loadPaperSoul())

  useEffect(() => {
    const refresh = () => setSoul(loadPaperSoul())
    window.addEventListener('storage', refresh)
    window.addEventListener('lia-intent', refresh as EventListener)
    const id = window.setInterval(refresh, 3000)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('lia-intent', refresh as EventListener)
      clearInterval(id)
    }
  }, [])

  const pct = Math.min(100, (soul.score / 999) * 100)
  const r = 40
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  if (compact) {
    return (
      <Link
        to="/wallet"
        className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/5 px-2.5 py-1 text-[10px] text-cyan-100/90 hover:border-cyan-400/40"
        title="Paper Soul Score"
      >
        <span className="font-mono font-bold text-cyan-300">{soul.score}</span>
        <span className="text-zinc-500">Soul · paper</span>
      </Link>
    )
  }

  return (
    <div className="card border-cyan-500/20">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold text-cyan-100">Sovereign Identity · paper</h2>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            Pas un SBT on-chain — score local jusqu’à credentials MVX
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-cyan-400/80">vellum-ready</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-center">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#1a1a28" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{soul.score}</p>
            <p className="text-[9px] text-zinc-500 uppercase">score</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full text-xs">
          <Cred label="Creator" n={soul.creator} />
          <Cred label="Investor" n={soul.investor} />
          <Cred label="Governance" n={soul.governance} />
        </div>
      </div>
      <p className="text-[10px] text-zinc-600 mt-3">
        Intentions enregistrées : {soul.intents} · utilise ⌘K pour progresser (démo)
      </p>
    </div>
  )
}

function Cred({ label, n }: { label: string; n: number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 p-2">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="font-semibold text-white">{levelFor(n)}</p>
      <p className="mono text-[10px] text-cyan-300/80">{n}</p>
    </div>
  )
}

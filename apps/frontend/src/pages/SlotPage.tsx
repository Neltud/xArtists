/**
 * Primordial Slot — paper bank only.
 * Claim / on-chain spin stay fail-closed until slot SC codeHash is live.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const SYMBOLS = ['TRO', 'EGLD', 'NFT', 'RWA', '✦'] as const
type Sym = (typeof SYMBOLS)[number]

const WEIGHTS: Record<Sym, number> = {
  TRO: 38,
  EGLD: 24,
  NFT: 16,
  RWA: 8,
  '✦': 14,
}

const SPIN_COST = 5

function pick(): Sym {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
  let n = Math.random() * total
  for (const s of SYMBOLS) {
    n -= WEIGHTS[s]
    if (n <= 0) return s
  }
  return 'TRO'
}

function payout(reels: [Sym, Sym, Sym]): { tro: number; kind: string } {
  const [a, b, c] = reels
  if (a === b && b === c) {
    if (a === 'RWA') return { tro: 0, kind: 'JACKPOT RWA 1/1 — paper only, claim locked' }
    if (a === 'NFT') return { tro: 180, kind: 'Jackpot NFT 1/1 digital — paper' }
    if (a === 'EGLD') return { tro: 40, kind: '3× EGLD' }
    if (a === 'TRO') return { tro: 12, kind: '3× TRO' }
    return { tro: 80, kind: '3× scatter' }
  }
  const scatters = reels.filter(s => s === '✦').length
  if (scatters === 2) return { tro: 8, kind: '2× scatter' }
  if (a === b || b === c || a === c) return { tro: 2, kind: 'paire' }
  return { tro: 0, kind: '—' }
}

export default function SlotPage() {
  const [bank, setBank] = useState(500)
  const [reels, setReels] = useState<[Sym, Sym, Sym]>(['TRO', 'EGLD', 'NFT'])
  const [spinning, setSpinning] = useState(false)
  const [spins, setSpins] = useState(0)
  const [last, setLast] = useState<{ tro: number; kind: string } | null>(null)
  const [log, setLog] = useState<string[]>([])

  const canSpin = !spinning && bank >= SPIN_COST

  const spin = () => {
    if (!canSpin) return
    setSpinning(true)
    setBank(b => b - SPIN_COST)
    let ticks = 0
    const id = window.setInterval(() => {
      setReels([pick(), pick(), pick()])
      ticks += 1
      if (ticks >= 12) {
        window.clearInterval(id)
        const final: [Sym, Sym, Sym] = [pick(), pick(), pick()]
        const result = payout(final)
        setReels(final)
        setLast(result)
        setSpins(n => n + 1)
        if (result.tro > 0) setBank(b => b + result.tro)
        setLog(l => [`${final.join(' · ')} → ${result.kind}`, ...l].slice(0, 8))
        setSpinning(false)
      }
    }, 70)
  }

  const paytable = useMemo(
    () => [
      ['TRO TRO TRO', '+12 TRO'],
      ['EGLD ×3', '+40 TRO'],
      ['NFT ×3', 'jackpot digital paper'],
      ['RWA ×3', 'jackpot peinture 1/1 — claim OFF'],
      ['✦ ✦', '+8 TRO'],
    ],
    [],
  )

  return (
    <div className="page-wrap py-10 space-y-8 max-w-2xl">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-amber-400/80">Primordial Slot</p>
        <h1 className="display text-3xl md:text-4xl text-white">Temple · paper</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Bank TRO simulée. Entropy client-side. Aucun broadcast. Le jackpot RWA (peinture 1/1) n’est
          pas réclamable tant que le SC slot n’a pas de codeHash.
        </p>
      </header>

      <div className="rounded-2xl border border-amber-500/20 bg-zinc-950/70 p-5 space-y-5">
        <div className="flex items-baseline justify-between text-[12px] text-zinc-500">
          <span>
            Bank <span className="text-amber-200 tabular-nums">{bank}</span> TRO
          </span>
          <span>
            Spins <span className="tabular-nums text-zinc-300">{spins}</span> · coût {SPIN_COST}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {reels.map((s, i) => (
            <div
              key={i}
              className={`rounded-xl border border-white/10 bg-black/50 py-8 text-center text-lg font-semibold tracking-wide ${
                spinning ? 'text-zinc-500' : 'text-amber-100'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={!canSpin}
          className="w-full rounded-xl bg-amber-200/90 text-zinc-950 py-3 text-sm font-semibold disabled:opacity-40"
        >
          {spinning ? 'Scatter…' : bank < SPIN_COST ? 'Bank vide' : 'Spin paper'}
        </button>

        {last && (
          <p className="text-[12px] text-zinc-400">
            Dernier : <span className="text-zinc-200">{last.kind}</span>
            {last.tro > 0 ? ` · +${last.tro} TRO` : ''}
          </p>
        )}
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Paytable paper</h2>
        <ul className="space-y-1 text-[12px] text-zinc-400">
          {paytable.map(([k, v]) => (
            <li key={k} className="flex justify-between border-t border-white/5 py-2">
              <span className="font-mono text-zinc-300">{k}</span>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </section>

      {log.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Journal</h2>
          <ul className="space-y-1 text-[11px] font-mono text-zinc-500">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        Claim on-chain OFF. Docs : docs/PRIMORDIAL_SLOT.md.{' '}
        <Link to="/demo" className="text-zinc-400 hover:text-white">
          Tour démo
        </Link>
        {' · '}
        <Link to="/go-live" className="text-zinc-400 hover:text-white">
          GO_LIVE
        </Link>
      </p>
    </div>
  )
}

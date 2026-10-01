/**
 * Packs Pulse · Yield · Sentinel — paper-first, no technical leakage.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import PackOpenTheater from '../components/PackOpenTheater'
import PackProductDisclaimer from '../components/PackProductDisclaimer'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'

const ONLY: PackId[] = ['pulse', 'yield', 'sentinel']
const PACKS = (AGENT_PACKS || []).filter(p => p?.id && ONLY.includes(p.id)).slice(0, 3)

const RING: Record<string, string> = {
  pulse: 'border-emerald-500/30 hover:border-emerald-400/45',
  yield: 'border-teal-500/30 hover:border-teal-400/45',
  sentinel: 'border-sky-500/30 hover:border-sky-400/45',
}

export default function Agents() {
  const [selected, setSelected] = useState<PackId | null>(null)
  const [theater, setTheater] = useState<PackId | null>(null)
  const active = selected ? PACKS.find(p => p.id === selected) ?? null : null
  const theaterPack = theater ? PACKS.find(p => p.id === theater) ?? null : null

  return (
    <div className="animate-fade-in pb-14 max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="section-label">Packs · produits limités · pas un fonds</p>
        <h1 className="section-title display">Pulse · Yield · Sentinel</h1>
        <div className="atelier-title-rule" aria-hidden />
        <p className="section-lead">
          Trois accès uniques. Floor <strong className="text-zinc-300">10 EGLD</strong>. Checkout
          paper → pack local + ouverture. Pas un titre financier.
        </p>
        <p className="text-[12px] text-zinc-500">
          <Link to="/marketplace" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
            Marketplace
          </Link>
          {' · '}
          <Link to="/my-packs" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
            My Packs / salles
          </Link>
          {' · '}
          <Link to="/command-center" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
            Command Center
          </Link>
        </p>
      </header>

      <PackProductDisclaimer />

      {PACKS.length === 0 ? (
        <p className="text-sm text-zinc-500">Packs indisponibles pour le moment.</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          {PACKS.map(p => {
            const on = selected === p.id
            return (
              <div key={p.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`w-full text-left card card-play card-interactive ${
                    RING[p.id] || 'border-white/10'
                  } ${on ? 'ring-1 ring-white/25' : ''}`}
                >
                  <p className="text-[15px] font-semibold text-white">
                    {p.icon} {p.name}
                  </p>
                  <p className="text-[12px] text-zinc-500 mt-1 line-clamp-2">{p.tagline}</p>
                  <p className="mt-3 text-xl font-semibold text-white tabular-nums">
                    {p.priceEgld?.list ?? 10}{' '}
                    <span className="text-sm font-normal text-zinc-500">EGLD</span>
                  </p>
                </button>
                <button
                  type="button"
                  className="w-full btn-secondary text-xs"
                  onClick={() => setTheater(p.id)}
                >
                  Aperçu ouverture
                </button>
              </div>
            )
          })}
        </div>
      )}

      {active && (
        <section className="card space-y-3">
          <h2 className="text-sm font-semibold text-white">
            {active.icon} {active.name}
          </h2>
          <p className="text-[13px] text-zinc-400">{active.activity}</p>
          <ul className="text-[12px] text-zinc-500 space-y-1">
            {(active.entitlements || []).slice(0, 4).map((e, i) => (
              <li key={i}>· {e}</li>
            ))}
          </ul>
          <PackCheckout
            packId={active.id}
            onClear={() => setSelected(null)}
            onPaperDone={id => setTheater(id)}
          />
        </section>
      )}

      {!active && (
        <section className="card space-y-2">
          <p className="text-[13px] text-zinc-400">Choisis un pack pour le checkout.</p>
          <PackCheckout />
        </section>
      )}

      {theaterPack && (
        <PackOpenTheater
          pack={theaterPack}
          open={!!theater}
          onClose={() => setTheater(null)}
        />
      )}
    </div>
  )
}

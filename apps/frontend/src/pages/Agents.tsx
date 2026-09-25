/**
 * Packs — paper-first + ouverture auto après checkout.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import PackOpenTheater from '../components/PackOpenTheater'
import Phase4ReadinessBanner from '../components/Phase4ReadinessBanner'
import AdSlot from '../components/AdSlot'
import { AGENT_PACKS, type PackId } from '../config/agentPacks'

const ONLY: PackId[] = ['pulse', 'yield', 'sentinel']
const PACKS = AGENT_PACKS.filter(p => ONLY.includes(p.id)).slice(0, 3)

const RING: Record<PackId, string> = {
  pulse: 'border-emerald-500/30 hover:border-emerald-400/45',
  yield: 'border-teal-500/30 hover:border-teal-400/45',
  sentinel: 'border-sky-500/30 hover:border-sky-400/45',
}

export default function Agents() {
  const [selected, setSelected] = useState<PackId | null>(null)
  const [theater, setTheater] = useState<PackId | null>(null)
  const active = PACKS.find(p => p.id === selected) || null
  const theaterPack = PACKS.find(p => p.id === theater) || null

  return (
    <div className="animate-fade-in pb-14 max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Packs · paper · moteur économique
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Pulse · Yield · Sentinel
        </h1>
        <p className="text-zinc-400 text-[14px] leading-relaxed max-w-md">
          Trois accès. Checkout paper → pack local + ouverture scénique. Pas un fonds.
        </p>
        <p className="text-[12px] text-zinc-500">
          <Link
            to="/lia"
            className="text-cyan-300/90 hover:text-cyan-200 underline-offset-2 hover:underline"
          >
            Performance LIA · Vellum execution
          </Link>
          {' · '}
          <Link
            to="/trading"
            className="text-zinc-400 hover:text-white underline-offset-2 hover:underline"
          >
            Trading board
          </Link>
          {' · '}
          <Link
            to="/go-live"
            className="text-zinc-400 hover:text-white underline-offset-2 hover:underline"
          >
            GO_LIVE
          </Link>
        </p>
      </header>

      <Phase4ReadinessBanner variant="compact" />

      <AdSlot id="drop_feature" />

      <div className="grid sm:grid-cols-3 gap-3">
        {PACKS.map(p => {
          const on = selected === p.id
          return (
            <div key={p.id} className="space-y-2">
              <button
                type="button"
                onClick={() => setSelected(p.id)}
                className={`w-full text-left rounded-2xl border bg-zinc-950/70 p-4 transition-colors ${RING[p.id]} ${
                  on ? 'ring-1 ring-white/25' : ''
                }`}
              >
                <p className="text-[15px] font-semibold text-white">
                  {p.icon} {p.name}
                </p>
                <p className="text-[12px] text-zinc-500 mt-1 line-clamp-2">{p.tagline}</p>
                <p className="mt-3 text-xl font-semibold text-white tabular-nums">
                  {p.priceEur.list}
                  <span className="text-sm font-normal text-zinc-500 ml-1">€</span>
                </p>
              </button>
              <button
                type="button"
                onClick={() => setTheater(p.id)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 text-[12px] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
              >
                ▶ Preview ouverture
              </button>
            </div>
          )
        })}
      </div>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
        <p className="text-[13px] text-zinc-400 mb-3">
          {active ? `${active.name} · ${active.priceEur.list} € · paper` : 'Sélectionne un pack'}
        </p>
        <PackCheckout
          packId={selected}
          onClear={() => setSelected(null)}
          onPaperDone={id => setTheater(id)}
        />
      </section>

      <p className="text-[12px] text-zinc-600">
        <Link
          to="/my-packs"
          className="text-zinc-400 hover:text-white underline-offset-2 hover:underline"
        >
          My Packs
        </Link>
        {' · '}
        <Link
          to="/payments"
          className="text-zinc-400 hover:text-white underline-offset-2 hover:underline"
        >
          Paiements
        </Link>
        {' · '}
        <Link
          to="/museum"
          className="text-zinc-400 hover:text-white underline-offset-2 hover:underline"
        >
          Musée Pulse
        </Link>
      </p>

      {theaterPack && (
        <PackOpenTheater pack={theaterPack} open={!!theater} onClose={() => setTheater(null)} />
      )}
    </div>
  )
}

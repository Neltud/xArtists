/**
 * Packs — exactement 3 : Pulse · Yield · Sentinel. Aucun doublon UI.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PackCheckout from '../components/PackCheckout'
import {
  AGENT_PACKS,
  type AgentPackProfile,
  type PackId,
} from '../config/agentPacks'
import { canBuyAgent } from '../config/scStatus'

const ACCENT: Record<PackId, { ring: string; bar: string; soft: string }> = {
  pulse: {
    ring: 'border-emerald-500/35 hover:border-emerald-400/50',
    bar: 'bg-emerald-400',
    soft: 'from-emerald-500/10 to-transparent',
  },
  yield: {
    ring: 'border-teal-500/35 hover:border-teal-400/50',
    bar: 'bg-teal-400',
    soft: 'from-teal-500/10 to-transparent',
  },
  sentinel: {
    ring: 'border-sky-500/35 hover:border-sky-400/50',
    bar: 'bg-sky-400',
    soft: 'from-sky-500/10 to-transparent',
  },
}

const RISK_LABEL: Record<AgentPackProfile['risk'], string> = {
  medium: 'Profil actif',
  lower: 'Profil modéré',
  low: 'Profil prudent',
}

/** Garantie runtime : jamais plus de 3 packs IA. */
const PACKS = AGENT_PACKS.filter(p =>
  (['pulse', 'yield', 'sentinel'] as PackId[]).includes(p.id)
).slice(0, 3)

export default function Agents() {
  const [selected, setSelected] = useState<PackId | null>(null)
  const mintLive = canBuyAgent()
  const active = PACKS.find(p => p.id === selected) || null

  return (
    <div className="animate-fade-in pb-14 max-w-5xl mx-auto">
      <header className="mb-10 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Packs
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          Pulse · Yield · Sentinel
        </h1>
        <p className="text-zinc-400 text-[15px] leading-relaxed max-w-lg">
          Trois accès agents uniquement. NFT d’entitlement — pas un fonds, pas de rendement promis.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        {PACKS.map(p => {
          const a = ACCENT[p.id]
          const isOn = selected === p.id
          return (
            <article
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-gradient-to-b ${a.soft} bg-zinc-950/80 p-5 transition-colors ${a.ring} ${
                isOn ? 'ring-1 ring-white/20' : ''
              }`}
            >
              <div className={`absolute top-0 left-6 right-6 h-px ${a.bar} opacity-60`} />
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h2 className="text-xl font-semibold text-white tracking-tight">{p.name}</h2>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {RISK_LABEL[p.risk]}
                </span>
              </div>
              <p className="text-[13px] text-zinc-400 mb-4">{p.tagline}</p>

              <p className="text-3xl font-semibold text-white tabular-nums tracking-tight mb-5">
                {p.priceEur.list}
                <span className="text-base font-normal text-zinc-500 ml-1">€</span>
              </p>

              <ul className="space-y-1.5 mb-4 flex-1">
                {p.entitlements.slice(0, 3).map(e => (
                  <li key={e} className="text-[12px] text-zinc-300 flex gap-2">
                    <span className="text-zinc-600">—</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => {
                  setSelected(p.id)
                  requestAnimationFrame(() => {
                    document
                      .getElementById('pack-pay')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  })
                }}
                className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  isOn
                    ? 'bg-white text-zinc-900'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {isOn ? 'Sélectionné' : 'Sélectionner'}
              </button>
            </article>
          )
        })}
      </div>

      <section
        id="pack-pay"
        className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Souscription</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              {active
                ? `${active.name} · ${active.priceEur.list} €`
                : 'Sélectionnez un pack ci-dessus.'}
            </p>
          </div>
          {!mintLive && (
            <span className="text-[10px] text-zinc-600 border border-white/10 rounded-full px-2 py-0.5">
              Mint on-chain ultérieur
            </span>
          )}
        </div>
        <PackCheckout packId={selected} onClear={() => setSelected(null)} />
      </section>

      <p className="mt-8 text-[12px] text-zinc-600">
        Suivi après achat :{' '}
        <Link to="/my-packs" className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">
          My Packs
        </Link>
      </p>
    </div>
  )
}

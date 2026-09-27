/**
 * LIA Performance & Agents — Vellum exécute (PEM Vellum), Grok propose.
 * Supernova live + MX-8008 + trésorerie lecture seule.
 */
import { Link } from 'react-router-dom'
import Phase4ReadinessBanner from '../components/Phase4ReadinessBanner'
import Agent8008Panel from '../components/Agent8008Panel'
import TreasuryFlowsPanel from '../components/TreasuryFlowsPanel'
import SupernovaStatusBadge from '../components/SupernovaStatusBadge'

const PIPELINE = [
  {
    id: 'signal',
    title: 'Signaux & CrossScore',
    body: 'Paper desk · Supernova timing · pas d’ordre auto sans Guardian.',
  },
  {
    id: '8008',
    title: 'Agent 8008',
    body: 'lia-intent → journal + workflow Vellum xartists-8008-intents.',
  },
  {
    id: 'vellum',
    title: 'Vellum exécute',
    body: 'PEM Vellum uniquement · micro-tx après GO_LIVE.',
  },
  {
    id: 'settle',
    title: 'Journal & settle',
    body: 'Mirror paper · rewards holders selon treasuryFlows.',
  },
]

const PERF = [
  { k: 'Mode', v: 'Paper', note: 'SC flags OFF' },
  { k: 'Chain', v: 'Mainnet', note: 'lecture API publique' },
  { k: 'Agent', v: '8008', note: 'bridge navigateur' },
  { k: 'Treasury', v: 'Model', note: 'lecture seule' },
]

const packs = [
  { id: 'pulse', name: 'Pulse', icon: '◈' },
  { id: 'yield', name: 'Yield', icon: '🌾' },
  { id: 'sentinel', name: 'Sentinel', icon: '🛡' },
]

export default function LiaPerformancePage() {
  return (
    <div className="animate-fade-in space-y-6 pb-16 max-w-2xl mx-auto">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            LIA · Agents · Mainnet prep
          </p>
          <SupernovaStatusBadge />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Performance & exécution</h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
          Tous les trades ops passent par <strong className="text-zinc-300">Vellum</strong> avec{" "}
          <strong className="text-zinc-300">PEM Vellum</strong>. MX-8008 route les intents. Design FX +
          SFX (dock son).
        </p>
      </header>

      <Phase4ReadinessBanner />
      <Agent8008Panel />
      <TreasuryFlowsPanel />

      <section className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300/90">
          Pipeline d’exécution
        </p>
        <ol className="space-y-2">
          {PIPELINE.map((s, i) => (
            <li
              key={s.id}
              className="flex gap-3 rounded-xl border border-white/8 bg-black/30 px-3 py-2.5"
            >
              <span className="text-[11px] font-mono text-zinc-600 w-5 shrink-0">{i + 1}</span>
              <div>
                <p className="text-sm font-medium text-white">{s.title}</p>
                <p className="text-[12px] text-zinc-500 mt-0.5">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid sm:grid-cols-2 gap-2">
        {PERF.map(r => (
          <div key={r.k} className="rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{r.k}</p>
            <p className="text-lg font-semibold text-white tabular-nums">{r.v}</p>
            <p className="text-[11px] text-zinc-600">{r.note}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Agents packs</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {packs.map(p => (
            <Link
              key={p.id}
              to="/agents"
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 hover:border-white/25 transition-colors card-play"
            >
              <p className="text-sm font-semibold text-white">
                {p.icon} {p.name}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Produit d’accès · pas un yield</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-zinc-600">
        <Link to="/slot" className="text-zinc-400 hover:underline">
          Slot EGLD/USDC
        </Link>
        {' · '}
        <Link to="/venues" className="text-zinc-400 hover:underline">
          Location
        </Link>
        {' · '}
        <Link to="/trading" className="text-zinc-400 hover:underline">
          Trade
        </Link>
      </p>
    </div>
  )
}

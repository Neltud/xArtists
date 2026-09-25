/**
 * LIA Performance & Agents — Vellum exécute (PEM Vellum), Grok propose.
 * Mainnet-ready narrative · paper until GO_LIVE.
 */
import { Link } from 'react-router-dom'
import Phase4ReadinessBanner from '../components/Phase4ReadinessBanner'
import PaperLiveDesk from '../components/PaperLiveDesk'
import { AGENT_PACKS } from '../config/agentPacks'
import { canBuyAgent, AGENTS_LIVE, MARKETPLACE_LIVE } from '../config/scStatus'

const PIPELINE = [
  {
    id: 'sense',
    title: 'Sense',
    body: 'Prix live, CrossScore, signaux Pulse / Yield / Sentinel.',
  },
  {
    id: 'grok',
    title: 'Grok (brain)',
    body: 'Propose plans, sizing, TP/SL — ne signe jamais les txs user.',
  },
  {
    id: 'vellum',
    title: 'Vellum (execution)',
    body: 'Workflows + intents. PEM Vellum (hors git/chat) signe les legs autorisées.',
  },
  {
    id: 'guardian',
    title: 'Guardian',
    body: 'Limites, pause, allowlists. Fail-closed si flag SC OFF.',
  },
  {
    id: 'settle',
    title: 'Settle',
    body: 'Journal paper → mainnet seulement après checklist GO_LIVE.',
  },
]

const PERF = [
  { k: 'Latence signal → intent', v: '< 2 s', note: 'cible paper' },
  { k: 'Legs / jour (cap)', v: 'configurable', note: 'Guardian' },
  { k: 'Rake table / progressive', v: '15 % / 25 %', note: 'slot SC' },
  { k: 'Compounding', v: '10 colonnes', note: 'board trading' },
  { k: 'SC Agents', v: AGENTS_LIVE ? 'LIVE' : 'OFF', note: 'codeHash' },
  { k: 'SC Marketplace', v: MARKETPLACE_LIVE ? 'LIVE' : 'OFF', note: 'codeHash' },
]

export default function LiaPerformancePage() {
  const packs = AGENT_PACKS.filter(p => ['pulse', 'yield', 'sentinel'].includes(p.id))

  return (
    <div className="animate-fade-in space-y-8 pb-14 max-w-3xl mx-auto">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          LIA · Agents · Mainnet prep
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Performance & exécution
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
          Tous les trades ops passent par <strong className="text-zinc-300">Vellum</strong> avec{' '}
          <strong className="text-zinc-300">PEM Vellum</strong> (jamais exposée). Grok et le front
          proposent ; Guardian filtre ; SC flags restent OFF jusqu’à GO_LIVE.
        </p>
      </header>

      <Phase4ReadinessBanner />

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
          <div
            key={r.k}
            className="rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-2.5"
          >
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{r.k}</p>
            <p className="text-lg font-semibold text-white tabular-nums">{r.v}</p>
            <p className="text-[11px] text-zinc-600">{r.note}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Agents packs
        </p>
        <div className="grid sm:grid-cols-3 gap-2">
          {packs.map(p => (
            <Link
              key={p.id}
              to="/agents"
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 hover:border-white/25 transition-colors"
            >
              <p className="text-sm font-semibold text-white">
                {p.icon} {p.name}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{p.tagline}</p>
            </Link>
          ))}
        </div>
        <p className="text-[11px] text-zinc-600">
          Achat on-chain agents :{' '}
          {canBuyAgent() ? (
            <span className="text-emerald-400">ouvert</span>
          ) : (
            <span className="text-amber-300/90">paper / SC OFF</span>
          )}
        </p>
      </section>

      <PaperLiveDesk />

      <section className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-zinc-400 space-y-2">
        <p className="font-medium text-zinc-300">Règles PEM</p>
        <ul className="list-disc list-inside space-y-1">
          <li>PEM Vellum / LIA / GrokyversX : hors git, hors chat, hors front</li>
          <li>Vellum signe les txs d’ops autorisées uniquement</li>
          <li>Wallet user (xPortal) : tips, slot, marketplace — pas le PEM protocole</li>
          <li>Deploy mainnet : gate confirm_mainnet + revue humaine</li>
        </ul>
      </section>

      <p className="text-[11px] text-zinc-600 flex flex-wrap gap-x-3 gap-y-1">
        <Link to="/trading" className="text-zinc-400 hover:text-white">
          Trading board
        </Link>
        <Link to="/agents" className="text-zinc-400 hover:text-white">
          Packs
        </Link>
        <Link to="/go-live" className="text-zinc-400 hover:text-white">
          GO_LIVE
        </Link>
        <Link to="/slot" className="text-zinc-400 hover:text-white">
          Slot
        </Link>
        <Link to="/sitemap" className="text-zinc-400 hover:text-white">
          Sitemap
        </Link>
      </p>
    </div>
  )
}

/**
 * Maquette complète entité xArtists + succursales (modules).
 * Données : entity_map.json + live_network_snapshot (API MVX).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import PaperSoulScore from '../components/PaperSoulScore'
import { LINKS, LIA_WALLET } from '../config/links'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main/data'

type Branch = {
  id: string
  name: string
  kind: string
  status: string
  route: string
  desc: string
  evolution: string
}

type EntityDoc = {
  updated?: string
  entity?: {
    name: string
    type: string
    mission: string
    hq: string
    token: string
    supply_cap: number
    dapp: string
    github: string
  }
  branches?: Branch[]
  roadmap?: string[]
  review?: {
    date?: string
    verdict?: string
    live_shell_ok?: boolean
    sc_marketplace?: string
    lia_live_trading?: boolean
  }
}

type LiveSnap = {
  updated?: string
  economics?: { egld_price_usd?: number; market_cap_usd?: number; apr?: number }
  lia_ops?: { balance_egld?: number; nonce?: number; address?: string }
}

function statusStyle(s: string) {
  if (s.includes('paper') || s.includes('demo')) return 'border-cyan-500/40 text-cyan-200 bg-cyan-500/10'
  if (s.includes('sc_pending') || s === 'partial') return 'border-amber-500/40 text-amber-200 bg-amber-500/10'
  if (s.includes('live') || s === 'ui_live') return 'border-emerald-500/40 text-emerald-200 bg-emerald-500/10'
  if (s === 'shell') return 'border-zinc-500/40 text-zinc-400 bg-zinc-500/10'
  if (s === 'external') return 'border-purple-500/40 text-purple-200 bg-purple-500/10'
  return 'border-white/10 text-zinc-300'
}

const KIND_ORDER = [
  'cerveau',
  'commerce',
  'produit',
  'création',
  'token',
  'gouvernance',
  'finance',
  'defi',
  'funding',
  'ops',
  'réel',
  'identité',
  'demo',
  'partenaire',
]

export default function EntityMap() {
  const [doc, setDoc] = useState<EntityDoc | null>(null)
  const [live, setLive] = useState<LiveSnap | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let c = false
    ;(async () => {
      const t = Date.now()
      try {
        const [e, l] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/entity_map.json?t=${t}`, { cache: 'no-store' })
            .then(r => (r.ok ? r.json() : null))
            .catch(() => null),
          fetch(`${import.meta.env.BASE_URL}data/live_network_snapshot.json?t=${t}`, { cache: 'no-store' })
            .then(r => (r.ok ? r.json() : null))
            .catch(() => null),
        ])
        let entity = e
        let snap = l
        if (!entity) {
          entity = await fetch(`${RAW}/entity_map.json?t=${t}`, { cache: 'no-store' }).then(r =>
            r.ok ? r.json() : null
          )
        }
        if (!snap) {
          snap = await fetch(`${RAW}/live_network_snapshot.json?t=${t}`, { cache: 'no-store' }).then(r =>
            r.ok ? r.json() : null
          )
        }
        if (c) return
        if (!entity) setErr('entity_map indisponible')
        setDoc(entity)
        setLive(snap)
      } catch {
        if (!c) setErr('chargement entité échoué')
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const ent = doc?.entity
  const branches = [...(doc?.branches || [])].sort((a, b) => {
    const ia = KIND_ORDER.indexOf(a.kind)
    const ib = KIND_ORDER.indexOf(b.kind)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
  const review = doc?.review
  const verdict = review?.verdict || 'GO_DEMO'

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <PageGuide page="entity" />

      <header className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.25em] text-purple-400/90">Organisation protocole</p>
        <h1 className="text-3xl md:text-4xl font-black text-white">{ent?.name || 'xArtists'}</h1>
        <p className="text-zinc-400 max-w-2xl text-sm leading-relaxed">{ent?.mission}</p>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">{ent?.type}</span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-300">HQ {ent?.hq}</span>
          <span className="rounded-full border border-emerald-500/30 px-3 py-1 text-emerald-200">
            ${'{'}ent?.token || 'TRO-94c925'{'}'} · cap {ent?.supply_cap?.toLocaleString('fr-FR') ?? '500 000'}
          </span>
          <a href={ent?.github || LINKS.github} className="rounded-full border border-white/10 px-3 py-1 text-cyan-300 hover:bg-white/5" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </div>
      </header>

      {/* Verdict bandeau */}
      <div
        className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
          verdict.includes('GO')
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : 'border-amber-500/40 bg-amber-500/10'
        }`}
      >
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-400">Revue entité</p>
          <p className="text-lg font-black text-white">{verdict}</p>
          <p className="text-[11px] text-zinc-500">
            {review?.date || '—'} · shell {review?.live_shell_ok ? 'OK' : '?'} · SC market{' '}
            {review?.sc_marketplace || 'pending'} · LIA live{' '}
            {review?.lia_live_trading ? 'ON' : 'OFF'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/trading" className="btn-primary text-xs py-2 px-3">
            Board LIA
          </Link>
          <Link to="/agents/voyage" className="btn-secondary text-xs py-2 px-3">
            Voyage
          </Link>
          <Link to="/sim" className="btn-secondary text-xs py-2 px-3">
            Sim Lab
          </Link>
        </div>
      </div>

      {err && <p className="text-amber-400 text-sm">{err}</p>}

      {/* Live ops strip */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">EGLD (ref)</p>
          <p className="text-xl font-bold mono mt-1">
            {live?.economics?.egld_price_usd != null
              ? `$${Number(live.economics.egld_price_usd).toFixed(2)}`
              : '—'}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">Market cap MVX</p>
          <p className="text-xl font-bold mono mt-1">
            {live?.economics?.market_cap_usd != null
              ? `$${(Number(live.economics.market_cap_usd) / 1e9).toFixed(2)}B`
              : '—'}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">LIA ops wallet</p>
          <p className="text-sm font-mono mt-1 truncate" title={live?.lia_ops?.address || LIA_WALLET}>
            {(live?.lia_ops?.address || LIA_WALLET).slice(0, 12)}…
          </p>
          <p className="text-lg font-bold mono text-cyan-300">
            {live?.lia_ops?.balance_egld != null
              ? `${Number(live.lia_ops.balance_egld).toFixed(4)} EGLD`
              : '—'}
          </p>
          <p className="text-[10px] text-zinc-600">nonce {live?.lia_ops?.nonce ?? '—'}</p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">Network APR (ref)</p>
          <p className="text-xl font-bold mono mt-1">
            {live?.economics?.apr != null ? `${(Number(live.economics.apr) * 100).toFixed(2)}%` : '—'}
          </p>
          <p className="text-[10px] text-zinc-600 mt-1">Succursales : {branches.length}</p>
        </div>
      </section>

      <PaperSoulScore />

      {/* Org chart simplified */}
      <section className="card border-purple-500/20">
        <h2 className="text-lg font-bold mb-3">Structure · cerveau → produits</h2>
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          <div className="flex-1 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-center">
            <p className="text-2xl mb-1">🧠</p>
            <p className="font-bold text-cyan-100">LIA / Vellum</p>
            <p className="text-[11px] text-zinc-500">Décision · paper · policy</p>
            <Link to="/trading" className="text-xs text-cyan-300 underline mt-2 inline-block">
              Terminal →
            </Link>
          </div>
          <div className="hidden md:flex items-center text-zinc-600">→</div>
          <div className="flex-[2] grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { to: '/marketplace', label: 'Market', icon: '🛒' },
              { to: '/agents', label: 'Agents', icon: '🧠' },
              { to: '/agents/voyage', label: 'Voyage', icon: '✈️' },
              { to: '/studio', label: 'Studio', icon: '🎨' },
              { to: '/tro', label: '$TRO', icon: '🪙' },
              { to: '/dao', label: 'DAO', icon: '🗳️' },
            ].map(x => (
              <Link
                key={x.to}
                to={x.to}
                className="rounded-lg border border-white/10 bg-black/30 p-3 text-center hover:border-purple-400/40"
              >
                <span className="text-lg">{x.icon}</span>
                <p className="text-xs font-semibold mt-1">{x.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Succursales · modules ({branches.length})</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {branches.map(b => (
            <Link
              key={b.id}
              to={b.route}
              className="card hover:border-purple-500/40 flex flex-col gap-2 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase text-zinc-500">{b.kind}</p>
                  <h3 className="font-bold text-sm">{b.name}</h3>
                </div>
                <span
                  className={`text-[9px] uppercase px-2 py-0.5 rounded-full border shrink-0 ${statusStyle(
                    b.status
                  )}`}
                >
                  {b.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 flex-1">{b.desc}</p>
              <p className="text-[10px] text-purple-300/80 border-t border-white/5 pt-2">
                Évolution : {b.evolution}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="card border-amber-500/20">
        <h2 className="font-bold mb-2">Roadmap P0–P2</h2>
        <ol className="list-decimal pl-5 text-sm text-zinc-300 space-y-1">
          {(doc?.roadmap || []).map(r => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </section>

      <section className="card text-xs text-zinc-500">
        <p className="font-semibold text-zinc-300 mb-1">Audit données</p>
        <ul className="space-y-1 list-disc pl-4">
          <li>Prix EGLD / market cap / soldes LIA : API MultiversX</li>
          <li>Board LIA / brain / fusion : JSON paper (Vellum production_run)</li>
          <li>Marketplace & agents on-chain : codeHash null — pas de faux GMV</li>
          <li>Voyage / on-ramp / liquidity : paper ou demo — pas de booking ni bridge live</li>
          <li>entity_map mis à jour : {doc?.updated || '—'}</li>
        </ul>
      </section>
    </div>
  )
}

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
}

type LiveSnap = {
  updated?: string
  economics?: { egld_price_usd?: number; market_cap_usd?: number; apr?: number }
  lia_ops?: { balance_egld?: number; nonce?: number; address?: string }
}

function statusStyle(s: string) {
  if (s.includes('paper')) return 'border-cyan-500/40 text-cyan-200 bg-cyan-500/10'
  if (s.includes('sc_pending') || s === 'partial') return 'border-amber-500/40 text-amber-200 bg-amber-500/10'
  if (s.includes('live') || s === 'ui_live') return 'border-emerald-500/40 text-emerald-200 bg-emerald-500/10'
  if (s === 'shell') return 'border-zinc-500/40 text-zinc-400 bg-zinc-500/10'
  if (s === 'external') return 'border-purple-500/40 text-purple-200 bg-purple-500/10'
  return 'border-white/10 text-zinc-300'
}

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
        // Live refresh economics from API when possible
        try {
          const eco = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' }).then(r =>
            r.ok ? r.json() : null
          )
          const acc = await fetch(`https://api.multiversx.com/accounts/${LIA_WALLET}`, {
            cache: 'no-store',
          }).then(r => (r.ok ? r.json() : null))
          if (eco || acc) {
            snap = {
              ...(snap || {}),
              updated: new Date().toISOString(),
              economics: {
                egld_price_usd: eco?.price,
                market_cap_usd: eco?.marketCap,
                apr: eco?.apr,
              },
              lia_ops: {
                address: LIA_WALLET,
                balance_egld: acc?.balance != null ? Number(acc.balance) / 1e18 : snap?.lia_ops?.balance_egld,
                nonce: acc?.nonce,
              },
            }
          }
        } catch {
          /* offline API */
        }
        if (!c) {
          setDoc(entity)
          setLive(snap)
          if (!entity) setErr('entity_map.json manquant — push data/')
        }
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'load error')
      }
    })()
    return () => {
      c = true
    }
  }, [])

  const ent = doc?.entity
  const branches = doc?.branches || []

  return (
    <div className="animate-fade-in pb-12 space-y-6">
      <PageGuide page="dashboard" />

      <header className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-[#0a0a12] to-cyan-950/30 p-6 md:p-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-purple-300/80">Entité · organigramme produit</p>
        <h1 className="text-3xl md:text-4xl font-black mt-1 gradient-text">{ent?.name || 'xArtists'}</h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-2xl">{ent?.mission}</p>
        <div className="flex flex-wrap gap-2 mt-4 text-[11px]">
          <span className="badge-purple">{ent?.type || '—'}</span>
          <span className="badge-gray">{ent?.hq || 'MultiversX'}</span>
          <span className="badge-gray">${ent?.token || 'TRO'} · cap {ent?.supply_cap?.toLocaleString() ?? '500 000'}</span>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 text-sm">
          <a href={ent?.github || LINKS.github} className="text-purple-300 hover:underline" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={LINKS.explorerAccount(LIA_WALLET)} className="text-cyan-300 hover:underline" target="_blank" rel="noreferrer">
            LIA ops explorer
          </a>
          <Link to="/sim" className="text-zinc-400 hover:underline">
            Sim Lab
          </Link>
        </div>
      </header>

      {err && <p className="text-amber-400 text-sm">{err}</p>}

      {/* Live network */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">EGLD price (live)</p>
          <p className="text-xl font-bold mono mt-1">
            ${live?.economics?.egld_price_usd != null ? Number(live.economics.egld_price_usd).toFixed(2) : '—'}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">MVX market cap</p>
          <p className="text-xl font-bold mono mt-1">
            {live?.economics?.market_cap_usd != null
              ? `$${(Number(live.economics.market_cap_usd) / 1e6).toFixed(1)}M`
              : '—'}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase text-zinc-500">LIA ops balance</p>
          <p className="text-xl font-bold mono mt-1">
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
        </div>
      </section>

      <PaperSoulScore />

      <section>
        <h2 className="text-lg font-bold mb-3">Succursales · modules</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {branches.map(b => (
            <Link
              key={b.id}
              to={b.route}
              className="card hover:border-purple-500/40 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase text-zinc-500">{b.kind}</p>
                  <h3 className="font-bold text-sm">{b.name}</h3>
                </div>
                <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full border ${statusStyle(b.status)}`}>
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
          <li>Prix EGLD / market cap / soldes LIA : API MultiversX (temps réel si CORS OK)</li>
          <li>Board LIA / brain / fusion : JSON paper publiés (Vellum production_run)</li>
          <li>Marketplace & agents on-chain : codeHash null — pas de faux GMV</li>
          <li>entity_map mis à jour : {doc?.updated || '—'}</li>
        </ul>
      </section>
    </div>
  )
}

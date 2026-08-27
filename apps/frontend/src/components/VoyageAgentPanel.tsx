import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { VOYAGE_AGENT, AGENT_PACKS } from '../config/agentPacks'

type Dest = {
  id: string
  label: string
  season: string
  bias: string
  score: number
  note: string
}

type Sig = {
  id: string
  type: string
  asset: string
  direction: string
  confidence: number
  horizon: string
  rationale: string
}

type VoyageData = {
  destinations?: Dest[]
  signals?: Sig[]
  mode?: string
  list_eur?: number
}

/** Agent de voyage — pack thématique + signaux paper (advisory v1). */
export default function VoyageAgentPanel({ compact = false }: { compact?: boolean }) {
  const pack = AGENT_PACKS.find(p => p.id === 'voyage')
  const [data, setData] = useState<VoyageData | null>(null)

  useEffect(() => {
    let cancelled = false
    const urls = [
      `${import.meta.env.BASE_URL}data/voyage_agent.json`,
      'https://raw.githubusercontent.com/Neltud/xArtists/main/data/voyage_agent.json',
    ]
    ;(async () => {
      for (const url of urls) {
        try {
          const r = await fetch(`${url}?t=${Date.now()}`)
          if (!r.ok) continue
          const j = (await r.json()) as VoyageData
          if (!cancelled && j) {
            setData(j)
            return
          }
        } catch {
          /* next */
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const dests = Array.isArray(data?.destinations) ? data!.destinations! : []
  const signals = Array.isArray(data?.signals) ? data!.signals! : []

  return (
    <section
      className="mb-8 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/30 via-[#0d0d14] to-transparent p-5"
      aria-labelledby="voyage-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h2 id="voyage-title" className="text-lg font-bold text-amber-200 flex items-center gap-2">
            <span aria-hidden>✈️</span> {VOYAGE_AGENT.name}
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            Sleeve thématique{' '}
            <strong className="text-amber-100/90">travel / culture / RWA hospitality</strong>.
            v1 = signaux & badge NFT — <em>pas</em> de réservation réelle ni custodie voyage.
          </p>
        </div>
        <span className="badge-gray text-[10px]">
          pack · {data?.list_eur ?? pack?.priceEur.list ?? 14} € list · {data?.mode || 'paper'}
        </span>
      </div>

      <ul className="grid sm:grid-cols-2 gap-2 text-xs text-zinc-300 mb-4">
        {VOYAGE_AGENT.v1_scope.map(s => (
          <li key={s} className="flex gap-2 rounded-lg bg-black/30 border border-white/5 px-3 py-2">
            <span className="text-amber-400/90">✓</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>

      {!compact && dests.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-amber-400/80 mb-2">Destinations (paper)</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {dests.map(d => (
              <div
                key={d.id}
                className="rounded-xl border border-amber-500/15 bg-black/25 px-3 py-2 text-xs"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-amber-100">{d.label}</span>
                  <span className="text-zinc-500">{d.season}</span>
                </div>
                <p className="text-amber-300/90 mt-0.5">{d.bias}</p>
                <p className="text-zinc-500 mt-1">{d.note}</p>
                <p className="text-[10px] text-zinc-600 mt-1">score {(d.score * 100).toFixed(0)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!compact && signals.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-amber-400/80">Signaux voyage</p>
          {signals.map(s => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-white/5 bg-[#111118] px-3 py-2 text-xs"
            >
              <span className="font-mono text-amber-200/90 min-w-[100px]">{s.asset}</span>
              <span className="text-zinc-400 flex-1">{s.rationale}</span>
              <span className="text-emerald-400/90">{s.direction}</span>
              <span className="text-zinc-500">{(s.confidence * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-zinc-500 mb-3">
        Hors scope v1 : {VOYAGE_AGENT.v1_not.join(' · ')}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link to="/agents/voyage" className="btn-primary text-sm">
          Page Agent Voyage →
        </Link>
        <Link to="/agents" className="btn-secondary text-sm">
          Catalogue packs
        </Link>
        <a
          href="https://app.greensmoke.network/agents"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary text-sm"
        >
          GSN travel feed ↗
        </a>
      </div>
    </section>
  )
}

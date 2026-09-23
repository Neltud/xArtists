/**
 * CrossAgentPanel — Grok ↔ LIA (Vellum) bridge transparency
 * Reads public mirrored JSON only (no secrets).
 */
import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

type CrossScore = {
  ts?: string
  score?: number
  components?: Record<string, number>
  rationale?: string
  horizon?: string
  agents?: string[]
}

type FeedbackEntry = {
  ts?: string
  from_agent?: string
  to_agent?: string
  kind?: string
  summary?: string
}

type FeedbackSummary = {
  ts?: string
  count?: number
  entries?: FeedbackEntry[]
}

async function loadJson<T>(paths: string[]): Promise<T | null> {
  for (const url of paths) {
    try {
      const r = await fetch(url, { cache: 'no-store' })
      if (!r.ok) continue
      return (await r.json()) as T
    } catch {
      /* next */
    }
  }
  return null
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 50) return 'text-teal-300'
  if (score >= 35) return 'text-amber-400'
  return 'text-red-400'
}

function kindBadge(kind?: string): string {
  switch (kind) {
    case 'performance':
      return 'bg-violet-900/40 text-violet-300'
    case 'signal':
      return 'bg-sky-900/40 text-sky-300'
    case 'design_360':
      return 'bg-fuchsia-900/40 text-fuchsia-300'
    case 'risk':
      return 'bg-red-900/40 text-red-300'
    case 'lesson':
      return 'bg-amber-900/40 text-amber-300'
    default:
      return 'bg-zinc-800 text-zinc-400'
  }
}

export default function CrossAgentPanel() {
  const [cross, setCross] = useState<CrossScore | null>(null)
  const [fb, setFb] = useState<FeedbackSummary | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const t = Date.now()
      const base = import.meta.env.BASE_URL
      const [c, f] = await Promise.all([
        loadJson<CrossScore>([
          `${base}data/cross_score.json?t=${t}`,
          `${RAW}/data/cross_score.json?t=${t}`,
        ]),
        loadJson<FeedbackSummary>([
          `${base}data/agent_feedback_summary.json?t=${t}`,
          `${RAW}/data/agent_feedback_summary.json?t=${t}`,
        ]),
      ])
      if (!cancelled) {
        setCross(c)
        setFb(f)
        setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded) {
    return (
      <div className="card mb-8 animate-pulse">
        <div className="h-5 w-48 bg-zinc-800 rounded mb-3" />
        <div className="h-16 bg-zinc-800/60 rounded" />
      </div>
    )
  }

  if (!cross && !fb?.entries?.length) {
    return (
      <div className="card mb-8 border border-dashed border-zinc-700">
        <h2 className="text-lg font-bold mb-1">Grok ↔ LIA bridge</h2>
        <p className="text-xs text-zinc-500">
          Pas encore de CrossScore — lance un cycle{' '}
          <code className="text-zinc-400">lia.vellum.grok_mcp_ingest</code> ou le serveur MCP.
        </p>
      </div>
    )
  }

  const score = cross?.score ?? null
  const comps = cross?.components || {}

  return (
    <div className="card mb-8">
      <div className="flex flex-wrap justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-bold">Grok ↔ LIA · CrossScore</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Signaux fusionnés · design 360 · feedback agents · paper-first
          </p>
        </div>
        {score != null && (
          <div className="text-right">
            <div className={`text-3xl font-bold mono ${scoreColor(score)}`}>
              {score.toFixed(1)}
            </div>
            <div className="text-[10px] uppercase text-zinc-500 tracking-wide">
              {cross?.horizon || '1h'} · {cross?.ts?.slice(0, 16) || '—'}
            </div>
          </div>
        )}
      </div>

      {Object.keys(comps).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {Object.entries(comps).map(([k, v]) => (
            <div
              key={k}
              className="rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2"
            >
              <div className="text-[10px] uppercase text-zinc-500 truncate">{k}</div>
              <div className={`text-lg font-semibold mono ${scoreColor(Number(v))}`}>
                {Number(v).toFixed(1)}
              </div>
              <div className="mt-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-400"
                  style={{ width: `${Math.max(0, Math.min(100, Number(v)))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {cross?.rationale && (
        <p className="text-xs text-zinc-500 mb-4 mono">{cross.rationale}</p>
      )}

      {fb?.entries && fb.entries.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-zinc-300">
            Feedback récent
            <span className="text-zinc-600 font-normal ml-2">
              {fb.count ?? fb.entries.length}
            </span>
          </h3>
          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {[...fb.entries].reverse().slice(0, 8).map((e, i) => (
              <li
                key={`${e.ts}-${i}`}
                className="flex flex-wrap items-start gap-2 text-xs border-b border-zinc-800/60 pb-2"
              >
                <span className={`px-2 py-0.5 rounded-full shrink-0 ${kindBadge(e.kind)}`}>
                  {e.kind || 'note'}
                </span>
                <span className="text-zinc-500 shrink-0">
                  {e.from_agent || '?'} → {e.to_agent || 'both'}
                </span>
                <span className="text-zinc-300 flex-1 min-w-[12rem]">{e.summary}</span>
                <span className="text-zinc-600 mono shrink-0">
                  {e.ts?.replace('T', ' ').slice(0, 16) || ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-zinc-600 mt-3">
        MCP · pas de PEM · lecture seule côté dApp · source{' '}
        <code>data/cross_score.json</code> + <code>agent_feedback_summary.json</code>
      </p>
    </div>
  )
}

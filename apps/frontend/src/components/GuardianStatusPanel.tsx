import { useEffect, useState } from 'react'

/** Guardian before Brain — reads orchestrator snapshot from data JSON. */
type GuardSnap = {
  allow?: boolean
  reason?: string
  max_notional?: number
  spiral_score?: number
  effective_leverage?: number
}

type StatusDoc = {
  updated?: string
  LIA_LIVE_TRADING?: number | string
  orchestrator?: {
    live_trading?: boolean
    agent_action?: string
    guardian?: GuardSnap
  }
  market?: { guard_status?: string }
}

const CANDIDATES = [
  `${import.meta.env.BASE_URL}data/lia_v6_status.json`,
  'data/lia_v6_status.json',
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lia_v6_status.json',
]

export default function GuardianStatusPanel({ compact = false }: { compact?: boolean }) {
  const [doc, setDoc] = useState<StatusDoc | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const t = Date.now()
      for (const base of CANDIDATES) {
        try {
          const url = base.includes('?') ? base : `${base}?t=${t}`
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok) continue
          const j = (await r.json()) as StatusDoc
          if (!cancelled) {
            setDoc(j)
            setErr(null)
          }
          return
        } catch {
          /* next */
        }
      }
      if (!cancelled) setErr('status unavailable')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const g = doc?.orchestrator?.guardian
  const live =
    doc?.orchestrator?.live_trading === true ||
    String(doc?.LIA_LIVE_TRADING ?? '0') === '1'
  const allow = g?.allow !== false
  const reason = g?.reason || (doc?.market?.guard_status === 'OK' ? 'ok' : 'unknown')

  if (err && !doc) {
    return (
      <div className="card mb-4 text-xs text-amber-400/90 border-amber-500/20">
        Guardian status : {err}. Vellum : <code>python -m lia.vellum.orchestrator</code>
      </div>
    )
  }

  if (compact) {
    return (
      <div
        className={`rounded-lg border px-3 py-2 text-xs flex flex-wrap gap-2 items-center ${
          allow ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/10'
        }`}
      >
        <span className="font-semibold">{allow ? '🛡️ Guardian OK' : '🛡️ Guardian BLOCK'}</span>
        <span className="text-gray-400">{reason}</span>
        <span className="badge-gray">{live ? 'LIVE' : 'PAPER'}</span>
        {g?.spiral_score != null && (
          <span className="mono text-gray-500">spiral {g.spiral_score.toFixed(3)}</span>
        )}
      </div>
    )
  }

  return (
    <div
      className={`card mb-6 ${
        allow ? 'border-emerald-500/25' : 'border-red-500/40 bg-red-500/5'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <h2 className="text-lg font-bold">🛡️ Guardian (avant Brain)</h2>
        <div className="flex gap-2 text-[10px]">
          <span className={allow ? 'badge-green' : 'badge-red'}>{allow ? 'ALLOW' : 'DENY'}</span>
          <span className="badge-gray">{live ? 'LIA_LIVE=1' : 'LIA_LIVE=0'}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Anti compound-death-spiral · levier SOL live ≤ 1.5× · RWA intent seulement si gate OK.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Reason</p>
          <p className="font-semibold mono text-xs">{reason}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Spiral</p>
          <p className="font-semibold">{g?.spiral_score != null ? g.spiral_score.toFixed(3) : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Lev. effectif</p>
          <p className="font-semibold">
            {g?.effective_leverage != null ? g.effective_leverage.toFixed(2) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Max notional</p>
          <p className="font-semibold text-purple-300">
            {g?.max_notional != null ? `$${g.max_notional.toFixed(0)}` : '—'}
          </p>
        </div>
      </div>
      {doc?.orchestrator?.agent_action && (
        <p className="text-xs text-gray-500 mt-3">
          Dernière action agent : <strong className="text-gray-300">{doc.orchestrator.agent_action}</strong>
          {doc.updated ? ` · ${doc.updated}` : ''}
        </p>
      )}
    </div>
  )
}

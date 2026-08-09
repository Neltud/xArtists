import { useEffect, useState } from 'react'
import InfoTip from './InfoTip'

type Role = { role: string; stance: string; score: number; note?: string }
type Desk = {
  action?: string
  confidence?: number
  net_score?: number
  risk_veto?: boolean
  agreement?: number
  rationale?: string
  roles?: Role[]
  paper?: boolean
}

const BASE = import.meta.env.BASE_URL
const DESK_URL = `${BASE}data/desk_last.json`
const RUN_URL = `${BASE}data/vellum_last_run.json`

function stanceColor(s: string) {
  if (s === 'BULL') return 'text-green-400'
  if (s === 'BEAR' || s === 'VETO') return 'text-red-400'
  return 'text-gray-400'
}

/** Paper desk debate — prefers desk_last.json (pipeline 1.3), falls back to vellum_last_run. */
export default function DeskPanel() {
  const [desk, setDesk] = useState<Desk | null>(null)
  const [fuseSrc, setFuseSrc] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let deskObj: Desk | null = null
        let fuse: string | null = null
        const r1 = await fetch(`${DESK_URL}?t=${Date.now()}`, { cache: 'no-store' })
        if (r1.ok) {
          const j = await r1.json()
          deskObj = (j?.desk as Desk) || null
          fuse = j?.fuse?.source || null
        }
        if (!deskObj) {
          const r2 = await fetch(`${RUN_URL}?t=${Date.now()}`, { cache: 'no-store' })
          if (!r2.ok) throw new Error(`HTTP ${r2.status}`)
          const j = await r2.json()
          deskObj = (j?.desk as Desk) || null
          fuse = j?.fuse?.source || null
        }
        if (!cancelled) {
          setDesk(deskObj)
          setFuseSrc(fuse)
          if (!deskObj) setErr('no desk payload')
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'desk unavailable')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (err && !desk) {
    return (
      <div className="card mb-4 border-gray-600/30 text-xs text-gray-500">
        Desk LIA : données absentes ({err}). Pipeline 1.3 :{' '}
        <code>python -m lia.vellum.pipeline</code>
      </div>
    )
  }
  if (!desk) {
    return <div className="card mb-4 h-20 animate-pulse bg-[#16161f]" aria-busy="true" />
  }

  return (
    <div className="card mb-4 border-indigo-500/25">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-bold flex items-center gap-1.5">
          Desk multi-rôles (paper)
          <InfoTip k="guardian" />
        </h2>
        <span className="text-[10px] text-gray-500">
          pipeline 1.3{fuseSrc ? ` · fuse:${fuseSrc}` : ''} · Guardian above
        </span>
      </div>
      <div className="flex flex-wrap gap-3 mb-3 text-sm">
        <div>
          <span className="text-xs text-gray-500">Action </span>
          <strong
            className={stanceColor(
              desk.action === 'BUY' ? 'BULL' : desk.action === 'SELL' ? 'BEAR' : 'NEUTRAL',
            )}
          >
            {desk.action || '—'}
          </strong>
        </div>
        <div>
          <span className="text-xs text-gray-500">Conf </span>
          <strong>{((desk.confidence || 0) * 100).toFixed(0)}%</strong>
        </div>
        <div>
          <span className="text-xs text-gray-500">Net </span>
          <strong className="mono">{(desk.net_score ?? 0).toFixed(3)}</strong>
        </div>
        {typeof desk.agreement === 'number' && (
          <div>
            <span className="text-xs text-gray-500">Accord </span>
            <strong>{(desk.agreement * 100).toFixed(0)}%</strong>
          </div>
        )}
        {desk.risk_veto && <span className="badge-red">RISK VETO</span>}
      </div>
      {desk.rationale && <p className="text-[11px] text-gray-400 mb-3">{desk.rationale}</p>}
      {desk.roles && desk.roles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {desk.roles.map(r => (
            <div key={r.role} className="rounded-lg bg-[#111118] px-2 py-1.5 text-[10px]">
              <div className="flex justify-between gap-1">
                <span className="text-gray-500 truncate">{r.role}</span>
                <span className={`font-semibold ${stanceColor(r.stance)}`}>{r.stance}</span>
              </div>
              <p className="mono text-gray-400">{r.score.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

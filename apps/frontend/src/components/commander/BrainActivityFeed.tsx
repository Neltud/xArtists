import { memo } from 'react'
import type { DeskPayload } from '../../hooks/useLiaSlowPath'

type Props = {
  desk: DeskPayload | null
  agentAction?: string
  mode?: string
  err?: string | null
}

function BrainActivityFeed({ desk, agentAction, mode, err }: Props) {
  if (err && !desk) {
    return (
      <div className="card mb-4 border-gray-600/30 text-xs text-gray-500">
        Brain feed offline ({err}). Vellum : <code>python -m lia.vellum.pipeline</code>
      </div>
    )
  }

  const action = desk?.action || agentAction || '—'
  const conf = desk?.confidence
  const veto = desk?.risk_veto

  return (
    <div className="card mb-4 border-indigo-500/25">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-bold">🧠 Brain activity (slow path)</h2>
        <div className="flex gap-2 text-[10px]">
          {mode && <span className="badge-gray">{mode}</span>}
          {desk?.paper !== false && <span className="badge-gray">PAPER DESK</span>}
          {veto && <span className="badge-red">RISK VETO</span>}
        </div>
      </div>
      <p className="text-sm text-gray-200 mb-2">
        <span className="text-gray-500">Decision · </span>
        <strong className="text-indigo-300">{action}</strong>
        {conf != null && (
          <span className="text-xs text-gray-500 ml-2">conf {(conf * 100).toFixed(0)}%</span>
        )}
      </p>
      {desk?.rationale && (
        <p className="text-xs text-gray-400 leading-relaxed mb-3">{desk.rationale}</p>
      )}
      {desk?.roles && desk.roles.length > 0 && (
        <ul className="space-y-1.5">
          {desk.roles.slice(0, 6).map((r) => (
            <li key={r.role} className="flex justify-between gap-2 text-xs border-b border-white/5 pb-1">
              <span className="text-gray-400">{r.role}</span>
              <span
                className={
                  r.stance === 'BULL'
                    ? 'text-emerald-400'
                    : r.stance === 'BEAR' || r.stance === 'VETO'
                      ? 'text-red-400'
                      : 'text-gray-400'
                }
              >
                {r.stance} · {r.score.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default memo(BrainActivityFeed)

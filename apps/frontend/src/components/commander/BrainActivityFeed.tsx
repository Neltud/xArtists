import { memo, useEffect, useState } from 'react'
import type { DeskPayload } from '../../hooks/useLiaSlowPath'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

type Props = {
  desk: DeskPayload | null
  agentAction?: string
  mode?: string
  err?: string | null
}

type BrainSnap = {
  ev?: { expected_value?: number; probability_of_profit?: number; is_viable?: boolean }
  meta?: { primary?: string; secondary?: string }
  decision_proof?: { verification?: string; proof?: { action_name?: string; decision_id?: string } }
  ts?: string
}

function BrainActivityFeed({ desk, agentAction, mode, err }: Props) {
  const [brain, setBrain] = useState<BrainSnap | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      const urls = [
        `${import.meta.env.BASE_URL}data/lia_brain_cycle.json?t=${Date.now()}`,
        `${RAW}/data/lia_brain_cycle.json?t=${Date.now()}`,
      ]
      for (const url of urls) {
        try {
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok) continue
          const j = (await r.json()) as BrainSnap
          if (!c) setBrain(j)
          return
        } catch {
          /* next */
        }
      }
    })()
    return () => {
      c = true
    }
  }, [])

  if (err && !desk && !brain) {
    return (
      <div className="card mb-4 border-gray-600/30 text-xs text-gray-500">
        Brain feed offline ({err}). Vellum : <code>python -m lia.vellum.production_run</code>
      </div>
    )
  }

  const action = desk?.action || agentAction || '—'
  const conf = desk?.confidence
  const veto = desk?.risk_veto
  const ev = brain?.ev
  const proof = brain?.decision_proof

  return (
    <div className="card mb-4 border-indigo-500/25">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-bold">Brain activity</h2>
        <div className="flex gap-2 text-[10px]">
          {mode && <span className="badge-gray">{mode}</span>}
          {desk?.paper !== false && <span className="badge-gray">PAPER DESK</span>}
          {veto && <span className="badge-red">RISK VETO</span>}
        </div>
      </div>

      <p className="text-sm text-gray-200 mb-2">
        <span className="text-gray-500">Desk · </span>
        <strong className="text-indigo-300">{action}</strong>
        {conf != null && (
          <span className="text-xs text-gray-500 ml-2">conf {(conf * 100).toFixed(0)}%</span>
        )}
      </p>
      {desk?.rationale && (
        <p className="text-xs text-gray-400 leading-relaxed mb-3">{desk.rationale}</p>
      )}

      {(ev || brain?.meta) && (
        <div className="grid grid-cols-3 gap-2 mb-3 text-[11px]">
          <div className="rounded-lg bg-black/30 border border-white/5 p-2">
            <p className="text-zinc-500 uppercase text-[9px]">EV</p>
            <p className="font-mono font-semibold">
              {ev?.expected_value != null ? `$${Number(ev.expected_value).toFixed(2)}` : '—'}
            </p>
            <p className={ev?.is_viable ? 'text-green-400' : 'text-zinc-500'}>
              {ev?.is_viable ? 'viable' : 'skip'}
            </p>
          </div>
          <div className="rounded-lg bg-black/30 border border-white/5 p-2">
            <p className="text-zinc-500 uppercase text-[9px]">Meta</p>
            <p className="font-semibold text-purple-200">{brain?.meta?.primary || '—'}</p>
            <p className="text-zinc-500">{brain?.meta?.secondary || ''}</p>
          </div>
          <div className="rounded-lg bg-black/30 border border-white/5 p-2">
            <p className="text-zinc-500 uppercase text-[9px]">Proof</p>
            <p className="font-semibold text-teal-200">{proof?.verification || '—'}</p>
            <p className="text-zinc-500 truncate" title={proof?.proof?.decision_id}>
              {proof?.proof?.action_name || '—'}
            </p>
          </div>
        </div>
      )}

      {desk?.roles && desk.roles.length > 0 && (
        <ul className="space-y-1.5">
          {desk.roles.slice(0, 6).map(r => (
            <li
              key={r.role}
              className="flex justify-between gap-2 text-xs border-b border-white/5 pb-1"
            >
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

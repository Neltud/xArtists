/**
 * Mini decision path: Guardian → Fusion → EV → Proof → Leg (paper).
 */
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

type Node = { id: string; label: string; ok: boolean; detail?: string }

export default function LiaPathStrip() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'g', label: 'Guardian', ok: false },
    { id: 'f', label: 'Fusion', ok: false },
    { id: 'e', label: 'EV', ok: false },
    { id: 'p', label: 'Proof', ok: false },
    { id: 'l', label: 'Leg', ok: false },
  ])

  useEffect(() => {
    let c = false
    ;(async () => {
      const t = Date.now()
      try {
        const [st, fus, br, legs] = await Promise.all([
          fetch(`${RAW}/data/lia_v6_status.json?t=${t}`, { cache: 'no-store' }).then(r =>
            r.ok ? r.json() : null
          ),
          fetch(`${RAW}/data/lia_signal_fusion.json?t=${t}`, { cache: 'no-store' }).then(r =>
            r.ok ? r.json() : null
          ),
          fetch(`${RAW}/data/lia_brain_cycle.json?t=${t}`, { cache: 'no-store' }).then(r =>
            r.ok ? r.json() : null
          ),
          fetch(`${RAW}/data/lia_paper_legs.json?t=${t}`, { cache: 'no-store' }).then(r =>
            r.ok ? r.json() : null
          ),
        ])
        if (c) return
        const g = (st as { orchestrator?: { guardian?: { allow?: boolean; kill_state?: string } } })
          ?.orchestrator?.guardian
        const fused = (fus as { fused?: { decision?: string } })?.fused
        const ev = (br as { ev?: { is_viable?: boolean; expected_value?: number } })?.ev
        const proof = (br as { decision_proof?: { verification?: string } })?.decision_proof
        const legList = (legs as { legs?: unknown[] })?.legs

        setNodes([
          {
            id: 'g',
            label: 'Guardian',
            ok: g?.allow !== false && g?.kill_state !== 'TRIPPED',
            detail: g?.kill_state || (g?.allow === false ? 'block' : 'ARMED'),
          },
          {
            id: 'f',
            label: 'Fusion',
            ok: Boolean(fused?.decision),
            detail: fused?.decision || '—',
          },
          {
            id: 'e',
            label: 'EV',
            ok: Boolean(ev?.is_viable),
            detail:
              ev?.expected_value != null ? `$${Number(ev.expected_value).toFixed(1)}` : '—',
          },
          {
            id: 'p',
            label: 'Proof',
            ok: Boolean(proof?.verification),
            detail: proof?.verification || '—',
          },
          {
            id: 'l',
            label: 'Leg',
            ok: Array.isArray(legList) && legList.length > 0,
            detail: Array.isArray(legList) ? `${legList.length}` : '0',
          },
        ])
      } catch {
        /* keep defaults */
      }
    })()
    return () => {
      c = true
    }
  }, [])

  return (
    <div className="card mb-2 border-indigo-500/20">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Chemin LIA (paper)
        </p>
        <Link to="/trading" className="text-[11px] text-indigo-300 hover:underline">
          Terminal →
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        {nodes.map((n, i) => (
          <div key={n.id} className="flex items-center gap-1 sm:gap-2">
            <div
              className={`rounded-lg border px-2.5 py-1.5 text-center min-w-[4.5rem] ${
                n.ok
                  ? 'border-green-500/35 bg-green-500/10'
                  : 'border-[#2a2a3a] bg-[#0d0d14]'
              }`}
            >
              <p className="text-[9px] uppercase text-zinc-500">{n.label}</p>
              <p className={`text-xs font-semibold ${n.ok ? 'text-green-300' : 'text-zinc-400'}`}>
                {n.detail || (n.ok ? 'ok' : '—')}
              </p>
            </div>
            {i < nodes.length - 1 && (
              <span className="text-zinc-600 text-xs hidden sm:inline">→</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-zinc-600 mt-2">
        Aucune TX user · DecisionProof = commitment paper · SC mint/buy gated
      </p>
    </div>
  )
}

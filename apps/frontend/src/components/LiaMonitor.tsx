/**
 * LIA activity monitor — paper stream (brain / risk / fusion / intents).
 */
import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main'

type LogType = 'info' | 'success' | 'warning' | 'executing' | 'ai'

type Log = {
  id: string
  ts: string
  message: string
  type: LogType
}

function nowTs() {
  return new Date().toLocaleTimeString('fr-FR', { hour12: false })
}

export default function LiaMonitor() {
  const [open, setOpen] = useState(true)
  const [status, setStatus] = useState<'idle' | 'active'>('idle')
  const [logs, setLogs] = useState<Log[]>([
    {
      id: '0',
      ts: nowTs(),
      message: 'Monitor prêt · paper · vellum.ia source de vérité ops',
      type: 'info',
    },
  ])

  const push = (message: string, type: LogType = 'info') => {
    setLogs(prev =>
      [{ id: Math.random().toString(36).slice(2, 9), ts: nowTs(), message, type }, ...prev].slice(
        0,
        40
      )
    )
  }

  useEffect(() => {
    const onIntent = (e: Event) => {
      const d = (e as CustomEvent).detail as { action?: string; summary?: string }
      setStatus('active')
      push(`Intent: ${d?.action || '?'} — ${d?.summary || ''}`, 'executing')
      window.setTimeout(() => setStatus('idle'), 2500)
    }
    window.addEventListener('lia-intent', onIntent as EventListener)
    return () => window.removeEventListener('lia-intent', onIntent as EventListener)
  }, [])

  useEffect(() => {
    let c = false
    ;(async () => {
      const t = Date.now()
      try {
        const [brain, risk, fusion] = await Promise.all([
          fetch(`${RAW}/data/lia_brain_cycle.json?t=${t}`, { cache: 'no-store' }).then(r =>
            r.ok ? r.json() : null
          ),
          fetch(`${RAW}/data/risk_manager_state.json?t=${t}`, { cache: 'no-store' }).then(r =>
            r.ok ? r.json() : null
          ),
          fetch(`${RAW}/data/lia_signal_fusion.json?t=${t}`, { cache: 'no-store' }).then(r =>
            r.ok ? r.json() : null
          ),
        ])
        if (c) return
        if (brain?.ev) {
          push(
            `Brain EV $${Number(brain.ev.expected_value).toFixed(2)} · viable=${brain.ev.is_viable}`,
            brain.ev.is_viable ? 'success' : 'warning'
          )
        }
        if (risk?.locked) push('Risk Manager LOCKDOWN', 'warning')
        else if (risk) push(`Risk ACTIVE · max dd ${(Number(risk.max_drawdown) * 100).toFixed(0)}%`, 'info')
        const dec = fusion?.fused?.decision
        if (dec) push(`Fusion advisory: ${dec}`, 'ai')
      } catch {
        push('Feeds JSON offline — production_run pour publier', 'warning')
      }
    })()
    return () => {
      c = true
    }
  }, [])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] text-zinc-400 backdrop-blur"
      >
        LIA Monitor
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 z-40 w-[min(20rem,calc(100vw-1.5rem))] pointer-events-auto">
      <div className="mb-2 flex items-center justify-between gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${status === 'idle' ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`}
          />
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">
            LIA · {status === 'idle' ? 'Ready' : 'Active'}
          </span>
        </div>
        <button type="button" className="text-[10px] text-zinc-500 hover:text-white" onClick={() => setOpen(false)}>
          hide
        </button>
      </div>
      <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
        {logs.slice(0, 8).map(log => (
          <div
            key={log.id}
            className="rounded-xl border border-white/5 bg-black/40 px-2.5 py-1.5 backdrop-blur"
          >
            <div className="flex justify-between gap-2">
              <span className="text-[9px] font-mono text-white/30">{log.ts}</span>
              <span className="text-[9px] text-zinc-600">{log.type}</span>
            </div>
            <p className="text-[11px] text-white/80 leading-snug font-mono line-clamp-2">{log.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

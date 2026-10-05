/** Poll execution telemetry — engine state + event feed. */
import { useEffect, useMemo, useState } from 'react'
import { asText } from '../../lib/safeRender'

type Ev = {
  ts?: string
  event?: string
  label?: string
  strategy?: string
  action?: string
  reason?: string
  tx_hash?: string
  message?: string
  amount_egld?: number
}

function deriveStatus(events: Ev[]): string {
  const last = events[0]
  if (!last) return 'Idle'
  const e = String(last.event || '')
  if (e === 'BROADCAST' || e === 'PENDING' || e === 'RETRYING' || e === 'ATTEMPT') {
    return 'Trading (in progress)'
  }
  if (e === 'EXECUTION_ERROR' || e === 'FAILED' || e === 'FAILED_SLIPPAGE' || e === 'FAILED_GAS') {
    return 'Error'
  }
  if (e === 'RISK_BLOCK' || e === 'BLOCKED') return 'Blocked (risk)'
  if (e === 'CONFIRMED') return 'Idle (last confirmed)'
  if (e === 'DECISION') return 'Deciding'
  return `Idle · ${e}`
}

export default function LiveExecutionFeed() {
  const [events, setEvents] = useState<Ev[]>([])
  const [risk, setRisk] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let c = false
    const load = async () => {
      const bases = [
        `${import.meta.env.BASE_URL || '/'}data/`,
        'https://neltud.github.io/xArtists/data/',
      ]
      for (const b of bases) {
        try {
          const [t, r] = await Promise.all([
            fetch(`${b}execution_telemetry.json`, { cache: 'no-store' }),
            fetch(`${b}risk_enforcer_state.json`, { cache: 'no-store' }),
          ])
          if (t.ok) {
            const j = await t.json()
            if (!c) setEvents(Array.isArray(j.events) ? j.events.slice().reverse() : [])
          }
          if (r.ok) {
            const rj = await r.json()
            if (!c) setRisk(rj)
          }
          return
        } catch {
          /* */
        }
      }
    }
    void load()
    const id = window.setInterval(() => void load(), 12_000)
    return () => {
      c = true
      window.clearInterval(id)
    }
  }, [])

  const status = useMemo(() => deriveStatus(events), [events])

  return (
    <section className="rounded-xl border border-orange-500/20 bg-orange-500/[0.04] p-3 space-y-3">
      <div className="flex flex-wrap justify-between gap-2 items-center">
        <p className="text-[10px] uppercase tracking-wider text-orange-200/90 font-semibold">
          Live execution
        </p>
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
            status.startsWith('Error')
              ? 'border-rose-500/40 text-rose-300'
              : status.startsWith('Trading')
                ? 'border-amber-500/40 text-amber-300 animate-pulse'
                : 'border-white/10 text-zinc-400'
          }`}
        >
          {status}
        </span>
      </div>
      {risk && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="rounded-lg bg-black/30 p-2">
            <p className="text-zinc-500 text-[9px] uppercase">Drawdown</p>
            <p className="tabular-nums text-white">
              {asText(((Number(risk.drawdown_pct) || 0) * 100).toFixed(2))}%
            </p>
          </div>
          <div className="rounded-lg bg-black/30 p-2">
            <p className="text-zinc-500 text-[9px] uppercase">Trades today</p>
            <p className="tabular-nums text-white">{asText(risk.trades_today)}</p>
          </div>
          <div className="rounded-lg bg-black/30 p-2">
            <p className="text-zinc-500 text-[9px] uppercase">Daily loss</p>
            <p className="tabular-nums text-white">{asText(risk.daily_loss_usd)}</p>
          </div>
          <div className="rounded-lg bg-black/30 p-2">
            <p className="text-zinc-500 text-[9px] uppercase">Halt</p>
            <p className={risk.halt ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {risk.halt ? 'ON' : 'off'}
            </p>
          </div>
        </div>
      )}
      <ul className="max-h-48 overflow-y-auto space-y-1 text-[10px] mono">
        {events.slice(0, 25).map((e, i) => (
          <li key={`${e.ts}-${i}`} className="border-t border-white/5 pt-1 text-zinc-400">
            <span className="text-zinc-600">{asText(e.ts)}</span>{' '}
            <span className="text-orange-300">{asText(e.event)}</span>{' '}
            {asText(e.label || e.strategy)} {asText(e.action)}
            {e.tx_hash && (
              <a
                className="text-cyan-400 underline ml-1"
                href={`https://explorer.multiversx.com/transactions/${e.tx_hash}`}
                target="_blank"
                rel="noreferrer"
              >
                {e.tx_hash.slice(0, 10)}…
              </a>
            )}
            {e.message && <span className="text-rose-400"> {asText(e.message)}</span>}
          </li>
        ))}
        {!events.length && <li className="text-zinc-600">No execution events yet</li>}
      </ul>
    </section>
  )
}

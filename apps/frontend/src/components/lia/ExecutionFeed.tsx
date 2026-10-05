/** Poll execution telemetry — no websocket required on static Pages. */
import { useEffect, useState } from 'react'
import { asText } from '../../lib/safeRender'

type Item = {
  ts?: string
  event?: string
  label?: string
  tx_hash?: string
  strategy?: string
  action?: string
  reason?: string
  message?: string
}

export default function ExecutionFeed() {
  const [items, setItems] = useState<Item[]>([])
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
          const [f, r] = await Promise.all([
            fetch(`${b}execution_feed_tail.json`, { cache: 'no-store' }),
            fetch(`${b}risk_enforcer_state.json`, { cache: 'no-store' }),
          ])
          if (f.ok) {
            const j = await f.json()
            if (!c) setItems(Array.isArray(j.items) ? j.items.slice().reverse() : [])
          }
          if (r.ok && !c) setRisk(await r.json())
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

  return (
    <section className="rounded-xl border border-orange-500/20 bg-orange-500/[0.04] p-3 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-orange-200/90 font-semibold">
        Live execution feed
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="rounded-lg bg-black/30 p-2">
          <p className="text-zinc-500 text-[9px] uppercase">Halt</p>
          <p className={risk?.halt ? 'text-rose-400' : 'text-emerald-400'}>
            {risk?.halt ? 'LOCKED' : 'OPEN'}
          </p>
        </div>
        <div className="rounded-lg bg-black/30 p-2">
          <p className="text-zinc-500 text-[9px] uppercase">Trades today</p>
          <p className="tabular-nums text-white">{asText(risk?.trades_today)}</p>
        </div>
        <div className="rounded-lg bg-black/30 p-2">
          <p className="text-zinc-500 text-[9px] uppercase">Daily loss $</p>
          <p className="tabular-nums text-white">{asText(risk?.daily_loss_usd)}</p>
        </div>
        <div className="rounded-lg bg-black/30 p-2">
          <p className="text-zinc-500 text-[9px] uppercase">Reason</p>
          <p className="truncate text-zinc-300">{asText(risk?.halt_reason || '—')}</p>
        </div>
      </div>
      <ul className="max-h-48 overflow-y-auto space-y-1 text-[10px] font-mono">
        {items.slice(0, 25).map((it, i) => (
          <li key={i} className="border-t border-white/5 pt-1 text-zinc-400">
            <span className="text-zinc-600">{asText(it.ts)?.slice(11, 19)}</span>{' '}
            <span className="text-orange-300">{asText(it.event)}</span>{' '}
            {asText(it.label || it.strategy)}{' '}
            {it.tx_hash && (
              <a
                className="text-cyan-400 underline"
                href={`https://explorer.multiversx.com/transactions/${it.tx_hash}`}
                target="_blank"
                rel="noreferrer"
              >
                {it.tx_hash.slice(0, 8)}…
              </a>
            )}
            {it.message ? ` · ${asText(it.message)}` : ''}
          </li>
        ))}
        {!items.length && <li className="text-zinc-600">No execution events yet</li>}
      </ul>
    </section>
  )
}

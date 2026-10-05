/** Admin — view Beta Strike limits (read-only on static Pages). */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { asText } from '../lib/safeRender'

const DEFAULTS = {
  max_trade_size_egld: 0.005,
  max_trade_size_usd: 15,
  max_daily_notional_usd: 40,
  max_drawdown_stop: 0.12,
  min_confidence_level: 0.62,
  slippage_tolerance_bps: 100,
}

export default function AdminPage() {
  const [local, setLocal] = useState(DEFAULTS)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('xartists_admin_beta_overlay')
      if (raw) setLocal({ ...DEFAULTS, ...JSON.parse(raw) })
    } catch {
      /* */
    }
  }, [])

  const save = () => {
    localStorage.setItem('xartists_admin_beta_overlay', JSON.stringify(local))
  }

  return (
    <div className="animate-fade-in space-y-4 max-w-lg mx-auto pb-16">
      <header>
        <p className="section-label">Admin</p>
        <h1 className="section-title display text-2xl">Beta Strike limits</h1>
        <p className="text-sm text-zinc-400">
          Static host: overlay is local only. Production YAML remains{' '}
          <code className="text-zinc-300">config/beta_strike.yaml</code> (ops deploy).
        </p>
      </header>
      <div className="space-y-3 card">
        {(Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]).map(k => (
          <label key={k} className="block text-[12px]">
            <span className="text-zinc-500">{k}</span>
            <input
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 tabular-nums"
              type="number"
              step="any"
              value={local[k]}
              onChange={e => setLocal({ ...local, [k]: Number(e.target.value) })}
            />
          </label>
        ))}
        <button type="button" className="btn-primary text-sm" onClick={save}>
          Save local overlay
        </button>
        <p className="text-[10px] text-zinc-600">
          Guardian still reads server YAML. Local overlay is for operator preview only.
        </p>
      </div>
      <p className="text-[11px] text-zinc-500">Active preview max trade USD: {asText(local.max_trade_size_usd)}</p>
      <Link to="/lia" className="btn-secondary text-sm">
        ← LIA hub
      </Link>
    </div>
  )
}

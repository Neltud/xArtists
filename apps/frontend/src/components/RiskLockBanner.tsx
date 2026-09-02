/**
 * Risk Manager lockdown banner — drawdown ceiling (paper state JSON).
 */
import { useEffect, useState } from 'react'

const RAW = 'https://raw.githubusercontent.com/Neltud/xArtists/main/data/risk_manager_state.json'

type RiskState = {
  locked?: boolean
  max_drawdown?: number
  current_drawdown?: number
  last_event?: string | null
  updated?: string
}

export default function RiskLockBanner() {
  const [s, setS] = useState<RiskState | null>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      const urls = [
        `${import.meta.env.BASE_URL}data/risk_manager_state.json?t=${Date.now()}`,
        `${RAW}?t=${Date.now()}`,
      ]
      for (const url of urls) {
        try {
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok) continue
          const j = (await r.json()) as RiskState
          if (!c) setS(j)
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

  if (!s) return null

  const locked = Boolean(s.locked)
  const maxPct = s.max_drawdown != null ? (Number(s.max_drawdown) * 100).toFixed(0) : '15'
  const curPct =
    s.current_drawdown != null ? (Number(s.current_drawdown) * 100).toFixed(1) : '—'

  if (!locked) {
    return (
      <div className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-100/90 flex flex-wrap gap-2 items-center">
        <span className="font-semibold">Risk Manager</span>
        <span className="text-emerald-300/80">ACTIVE</span>
        <span className="text-zinc-500">
          dd {curPct}% / max {maxPct}% · unlock ops-only si lockdown
        </span>
      </div>
    )
  }

  return (
    <div
      className="mb-4 rounded-lg border border-red-500 bg-red-500/15 px-3 py-3 text-sm text-red-100 animate-pulse"
      role="alert"
      aria-live="assertive"
    >
      <p className="font-bold tracking-wide">SYSTEM LOCKDOWN — Risk Manager</p>
      <p className="text-xs mt-1 opacity-90">
        {s.last_event || 'Drawdown limit exceeded. All agents commanded to cease operations.'}
      </p>
      <p className="text-[10px] mt-2 text-red-200/80">
        dd {curPct}% · plafond {maxPct}% · reset manuel ops uniquement
      </p>
    </div>
  )
}

import { useEffect } from 'react'
import { useRiskStore, bindRiskFromStatus } from '../../store/riskStore'

const CANDIDATES = [
  `${import.meta.env.BASE_URL}data/lia_v6_status.json`,
  'data/lia_v6_status.json',
  'https://raw.githubusercontent.com/Neltud/xArtists/main/data/lia_v6_status.json',
]

function shellClass(status: string): string {
  switch (status) {
    case 'SAFE':
      return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100'
    case 'WARNING':
      return 'bg-amber-500/15 border-amber-500/40 text-amber-100'
    case 'TRIPPED':
      return 'bg-orange-500/20 border-orange-500/50 text-orange-100'
    case 'KILLED':
      return 'bg-red-500/25 border-red-500/60 text-red-100 animate-pulse'
    default:
      return 'bg-gray-500/10 border-gray-600/40 text-gray-400'
  }
}

function label(status: string): string {
  switch (status) {
    case 'SAFE':
      return 'GUARDIAN SAFE'
    case 'WARNING':
      return 'GUARDIAN WARNING'
    case 'TRIPPED':
      return 'GUARDIAN TRIPPED'
    case 'KILLED':
      return 'KILL-SWITCH ACTIVE'
    default:
      return 'GUARDIAN —'
  }
}

export default function GuardianStatusBar() {
  const risk = useRiskStore()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const t = Date.now()
      for (const base of CANDIDATES) {
        try {
          const url = base.includes('?') ? base : `${base}?t=${t}`
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          if (!cancelled) bindRiskFromStatus(j)
          return
        } catch {
          /* next */
        }
      }
      if (!cancelled) bindRiskFromStatus(null)
    }
    load()
    const id = window.setInterval(
      load,
      risk.status === 'KILLED' || risk.status === 'TRIPPED' ? 3000 : 8000
    )
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [risk.status])

  return (
    <div
      className={`border-b px-3 py-1.5 text-[11px] sm:text-xs font-medium ${shellClass(risk.status)}`}
      role="status"
      aria-live={risk.status === 'KILLED' || risk.status === 'TRIPPED' ? 'assertive' : 'polite'}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-bold tracking-wide">{label(risk.status)}</span>
        <span className="opacity-80 mono truncate max-w-[14rem] sm:max-w-xs">{risk.reason}</span>
        {risk.mode && <span className="opacity-70">mode {risk.mode}</span>}
        <span className="badge-gray text-[10px]">{risk.liveTrading ? 'LIVE' : 'PAPER'}</span>
        {risk.currentDrawdown != null && (
          <span className="opacity-70 mono">DD {(risk.currentDrawdown * 100).toFixed(1)}%</span>
        )}
        {risk.spiralScore != null && (
          <span className="opacity-70 mono">S {risk.spiralScore.toFixed(3)}</span>
        )}
        {risk.alertMessage && <span className="font-semibold opacity-95">{risk.alertMessage}</span>}
      </div>
    </div>
  )
}

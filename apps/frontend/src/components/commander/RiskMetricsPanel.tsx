import { memo } from 'react'
import type { GuardianSnap } from '../../hooks/useLiaFastPath'

type Props = {
  guardian?: GuardianSnap
  equityUsd?: number
  drawdown?: number
  mode?: string
}

function RiskMetricsPanel({ guardian, equityUsd, drawdown, mode }: Props) {
  return (
    <div className="card mb-4 border-white/10">
      <h2 className="text-sm font-bold mb-3">📊 Risk metrics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Metric label="Equity" value={equityUsd != null ? `$${equityUsd.toFixed(0)}` : '—'} />
        <Metric
          label="Drawdown"
          value={drawdown != null ? `${(drawdown * 100).toFixed(1)}%` : '—'}
          warn={drawdown != null && Math.abs(drawdown) >= 0.08}
        />
        <Metric
          label="Spiral S"
          value={guardian?.spiral_score != null ? guardian.spiral_score.toFixed(3) : '—'}
          warn={guardian?.spiral_score != null && guardian.spiral_score >= 0.25}
        />
        <Metric
          label="VaR (hint)"
          value={guardian?.var_usd != null ? `$${guardian.var_usd.toFixed(0)}` : '—'}
        />
        <Metric
          label="Leverage"
          value={guardian?.effective_leverage != null ? `${guardian.effective_leverage.toFixed(2)}×` : '—'}
        />
        <Metric label="Mode" value={mode || '—'} />
        <Metric
          label="Allow"
          value={guardian?.allow === false ? 'NO' : guardian?.allow ? 'YES' : '—'}
          warn={guardian?.allow === false}
        />
        <Metric
          label="Max N"
          value={guardian?.max_notional != null ? `$${guardian.max_notional.toFixed(0)}` : '—'}
        />
      </div>
    </div>
  )
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${warn ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'}`}>
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`font-semibold mono text-sm ${warn ? 'text-amber-300' : 'text-gray-100'}`}>{value}</p>
    </div>
  )
}

export default memo(RiskMetricsPanel)

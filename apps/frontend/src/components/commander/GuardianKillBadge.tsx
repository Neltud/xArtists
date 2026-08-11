import { memo } from 'react'
import type { GuardianSnap } from '../../hooks/useLiaFastPath'

type Props = {
  killState: string
  allow?: boolean
  reason?: string
  live?: boolean
  guardian?: GuardianSnap
  compact?: boolean
}

function GuardianKillBadge({
  killState,
  allow = true,
  reason = '—',
  live = false,
  guardian,
  compact = false,
}: Props) {
  const ks = killState.toUpperCase()
  const killed = ks === 'KILLED'
  const tripped = ks === 'TRIPPED'
  const ok = ks === 'ARMED' && allow

  const shell = killed
    ? 'border-red-500 bg-red-500/15 text-red-100'
    : tripped
      ? 'border-orange-500 bg-orange-500/15 text-orange-100'
      : ok
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-100'

  const label = killed
    ? 'KILL-SWITCH ACTIVE'
    : tripped
      ? 'GUARDIAN TRIPPED'
      : ok
        ? 'GUARDIAN ARMED'
        : 'GUARDIAN BLOCK'

  if (compact) {
    return (
      <div
        className={`rounded-lg border px-3 py-2 text-xs flex flex-wrap gap-2 items-center ${shell} ${killed ? 'animate-pulse' : ''}`}
        role="status"
        aria-live={killed || tripped ? 'assertive' : 'polite'}
      >
        <span className="font-bold tracking-wide">{label}</span>
        <span className="opacity-80 mono">{reason}</span>
        <span className="badge-gray">{live ? 'LIVE' : 'PAPER'}</span>
      </div>
    )
  }

  return (
    <div
      className={`card mb-4 border ${shell} ${killed ? 'animate-pulse' : ''}`}
      role="status"
      aria-live={killed || tripped ? 'assertive' : 'polite'}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <h2 className="text-base font-bold flex items-center gap-2">
          <span aria-hidden>🛡️</span> {label}
        </h2>
        <div className="flex gap-2 text-[10px]">
          <span className={ok ? 'badge-green' : killed ? 'badge-red' : 'badge-gray'}>{ks}</span>
          <span className="badge-gray">{live ? 'LIA_LIVE=1' : 'LIA_LIVE=0'}</span>
        </div>
      </div>
      <p className="text-xs opacity-80 mb-3">
        Guardian before Brain · anti death-spiral · live SOL/HL lev ≤ 1.5× · reset ops-only
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wide opacity-60">Reason</p>
          <p className="font-semibold mono text-xs">{reason}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide opacity-60">Spiral</p>
          <p className="font-semibold">
            {guardian?.spiral_score != null ? guardian.spiral_score.toFixed(3) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide opacity-60">Lev.</p>
          <p className="font-semibold">
            {guardian?.effective_leverage != null ? guardian.effective_leverage.toFixed(2) : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide opacity-60">Max notional</p>
          <p className="font-semibold text-purple-300">
            {guardian?.max_notional != null ? `$${guardian.max_notional.toFixed(0)}` : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(GuardianKillBadge)

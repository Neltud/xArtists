/** UI banner for Pulse gate — FULL / SAMPLE / NONE (read-only). */
import type { TcaAccessResult } from '../../lib/tcaAccess'
import { Link } from 'react-router-dom'

export function PulseAccessBanner({ access }: { access: TcaAccessResult }) {
  if (access.status === 'FULL') {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-[11px] text-emerald-100/90">
        Pulse Pack · full TCA
        {access.expiryDate ? (
          <span className="text-emerald-200/60"> · until {access.expiryDate.slice(0, 10)}</span>
        ) : null}
      </div>
    )
  }
  if (access.status === 'SAMPLE') {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-50/90 space-y-1">
        <p>
          {access.reason === 'pulse_expired'
            ? 'Pulse Pack expired — sample lesson only.'
            : 'Sample access — one preview lesson. Full classroom needs Pack Pulse (12 months).'}
        </p>
        <Link to="/agents" className="underline text-amber-200/90">
          Get Pack Pulse →
        </Link>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-zinc-400">
      Lobby — explore the gallery or learn about{' '}
      <Link to="/agents" className="text-amber-200/80 underline">
        Pack Pulse
      </Link>
      .
    </div>
  )
}

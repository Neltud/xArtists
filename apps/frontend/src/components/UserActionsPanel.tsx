import { Link } from 'react-router-dom'
import { PRIMARY_ACTIONS, STATUS_LABEL, type ActionStatus } from '../config/userActions'

const badge: Record<ActionStatus, string> = {
  live: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  paper: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  gated: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-400',
  soon: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
}

export default function UserActionsPanel({ compact }: { compact?: boolean }) {
  const rows = compact ? PRIMARY_ACTIONS.slice(0, 8) : PRIMARY_ACTIONS
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Actions utilisateur</h2>
        <Link to="/demo" className="text-[11px] text-cyan-400/90 hover:underline">
          Tour démo →
        </Link>
      </div>
      <ul className="divide-y divide-white/5">
        {rows.map(a => (
          <li key={a.id}>
            <Link
              to={a.path}
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-[13px] text-zinc-100 font-medium min-w-[10rem]">{a.label}</span>
              <span
                className={`text-[10px] uppercase tracking-wider rounded-full border px-2 py-0.5 w-fit ${badge[a.status]}`}
              >
                {STATUS_LABEL[a.status]}
              </span>
              <span className="text-[11px] text-zinc-500 flex-1">{a.note}</span>
            </Link>
          </li>
        ))}
      </ul>
      {!compact && (
        <p className="px-4 py-2 text-[10px] text-zinc-600 border-t border-white/5">
          Paper ≠ promesse financière · SC = fail-closed jusqu’à verify codeHash · tips = dons
        </p>
      )}
    </div>
  )
}

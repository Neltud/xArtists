/**
 * TransactionOverlay — empireStore.tx feedback (Direct Execution from CommandWall).
 * Paper-testable: empireTxStart shows preparing → user dismisses.
 */
import { useEmpireTx, empireTxClear } from '../store/empireStore'

const PHASE_LABEL: Record<string, string> = {
  idle: '',
  preparing: 'Préparation…',
  signing: 'Signature wallet…',
  broadcast: 'Diffusion réseau…',
  success: 'Confirmé',
  error: 'Erreur',
}

export default function TransactionOverlay() {
  const tx = useEmpireTx()
  if (tx.phase === 'idle') return null

  const tone =
    tx.phase === 'error'
      ? 'border-rose-500/40 bg-rose-950/90'
      : tx.phase === 'success'
        ? 'border-emerald-500/40 bg-emerald-950/90'
        : 'border-cyan-500/30 bg-black/90'

  return (
    <div
      className="fixed inset-x-0 bottom-20 md:bottom-8 z-[80] flex justify-center pointer-events-none px-3"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto max-w-md w-full rounded-2xl border ${tone} backdrop-blur-md px-4 py-3 shadow-2xl space-y-2`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              Transaction · {PHASE_LABEL[tx.phase] || tx.phase}
            </p>
            <p className="text-sm text-white font-medium truncate">{tx.label || 'Action'}</p>
            {tx.error && <p className="text-xs text-rose-300 mt-1">{tx.error}</p>}
            {tx.sessionId && (
              <p className="text-[10px] mono text-zinc-500 mt-1 truncate">{tx.sessionId}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => empireTxClear()}
            className="text-zinc-400 hover:text-white text-xs shrink-0"
          >
            Fermer
          </button>
        </div>
        {tx.explorerUrl && (
          <a
            href={tx.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-cyan-300 underline"
          >
            Voir sur l’explorer
          </a>
        )}
        {(tx.phase === 'preparing' || tx.phase === 'signing') && (
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-cyan-500/80 to-violet-500/60" />
          </div>
        )}
      </div>
    </div>
  )
}

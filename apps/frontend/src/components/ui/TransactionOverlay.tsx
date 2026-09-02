/**
 * Guardian / TX ritual overlay — glassmorphism.
 * SUCCESS only when lifecycle says so (no fake setTimeout success).
 */
import { memo } from 'react'
import type { TxLifecycle } from '../../types/intent'

export type OverlayPhase =
  | 'IDLE'
  | 'PREPARING'
  | 'AWAITING_SIGNATURE'
  | 'CONFIRMING'
  | 'SUCCESS'
  | 'ERROR'

export function lifecycleToPhase(life: TxLifecycle | string, err?: string | null): OverlayPhase {
  if (err) return 'ERROR'
  switch (life) {
    case 'idle':
      return 'IDLE'
    case 'validating':
    case 'validated':
      return 'PREPARING'
    case 'pending_signature':
      return 'AWAITING_SIGNATURE'
    case 'broadcast':
    case 'pending':
      return 'CONFIRMING'
    case 'success':
      return 'SUCCESS'
    case 'error':
    case 'rejected':
      return 'ERROR'
    default:
      return 'IDLE'
  }
}

function TransactionOverlay({
  phase,
  title,
  detail,
  txHash,
  onClose,
}: {
  phase: OverlayPhase
  title?: string
  detail?: string
  txHash?: string | null
  onClose?: () => void
}) {
  if (phase === 'IDLE') return null

  const copy: Record<Exclude<OverlayPhase, 'IDLE'>, { h: string; c: string }> = {
    PREPARING: { h: 'Préparation', c: 'LIA / Doctrine prépare l’intent…' },
    AWAITING_SIGNATURE: {
      h: 'Signature requise',
      c: 'Confirme dans ton wallet (Web Wallet / xPortal).',
    },
    CONFIRMING: { h: 'Confirmation chaîne', c: 'Écoute du hash — pas de succès simulé.' },
    SUCCESS: { h: 'Confirmé on-chain', c: 'Transaction finalisée.' },
    ERROR: { h: 'Échec', c: detail || 'Intent bloqué ou TX rejetée.' },
  }
  const m = copy[phase as Exclude<OverlayPhase, 'IDLE'>]

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-md"
      role="alertdialog"
      aria-modal
      aria-labelledby="tx-overlay-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-2xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              id="tx-overlay-title"
              className={`text-lg font-bold ${
                phase === 'SUCCESS'
                  ? 'text-emerald-300'
                  : phase === 'ERROR'
                    ? 'text-rose-300'
                    : 'text-cyan-200'
              }`}
            >
              {title || m.h}
            </p>
            <p className="text-sm text-zinc-300 mt-1">{detail || m.c}</p>
          </div>
          {(phase === 'SUCCESS' || phase === 'ERROR') && onClose && (
            <button type="button" className="btn-secondary text-xs" onClick={onClose}>
              Fermer
            </button>
          )}
        </div>
        {txHash && (
          <a
            href={`https://explorer.multiversx.com/transactions/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="block text-[11px] mono text-cyan-300/90 truncate underline"
          >
            {txHash}
          </a>
        )}
        {phase === 'PREPARING' || phase === 'CONFIRMING' || phase === 'AWAITING_SIGNATURE' ? (
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-cyan-400/80 to-violet-400/80" />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default memo(TransactionOverlay)

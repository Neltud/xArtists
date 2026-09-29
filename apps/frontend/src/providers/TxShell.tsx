/**
 * TX shell + TransactionOverlay (Mission A).
 * - Optional MultiversX DappProvider is in MxDappProvider (Ledger-safe).
 * - This component provides the global TX status overlay driven by empireStore.
 * - Injects __xartistsSendTx bridge when sdk-dapp sendTransactions is available.
 */
import { useEffect, useCallback, type ReactNode } from 'react'
import {
  useEmpireTx,
  empireTxClear,
  empireTxStart,
  empireTxSigning,
  empireTxBroadcast,
  empireTxSuccess,
  empireTxError,
} from '../store/empireStore'

const EXPLORER = 'https://explorer.multiversx.com'

function phaseColor(phase: string): string {
  switch (phase) {
    case 'preparing':
    case 'signing':
      return 'border-violet-500/50 bg-violet-950/90'
    case 'broadcast':
      return 'border-amber-500/50 bg-amber-950/90'
    case 'success':
      return 'border-emerald-500/50 bg-emerald-950/90'
    case 'error':
      return 'border-red-500/50 bg-red-950/90'
    default:
      return 'border-zinc-700 bg-zinc-900/90'
  }
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'preparing':
      return 'Préparation…'
    case 'signing':
      return 'Signature wallet…'
    case 'broadcast':
      return 'Broadcast réseau…'
    case 'success':
      return 'Confirmé on-chain'
    case 'error':
      return 'Échec'
    default:
      return ''
  }
}

function TransactionOverlay() {
  const tx = useEmpireTx()
  if (tx.phase === 'idle') return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center pointer-events-none p-4"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto max-w-md w-full rounded-2xl border shadow-2xl backdrop-blur-md px-4 py-3 ${phaseColor(tx.phase)}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-zinc-400">
              {phaseLabel(tx.phase)}
            </p>
            <p className="text-sm font-medium text-white truncate">{tx.label || 'Transaction'}</p>
            {tx.error && (
              <p className="text-xs text-red-300 break-words">{tx.error}</p>
            )}
            {tx.sessionId && tx.phase !== 'error' && (
              <p className="text-[11px] mono text-zinc-400 truncate">session: {tx.sessionId}</p>
            )}
            {tx.explorerUrl && (
              <a
                href={tx.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs text-emerald-300 hover:underline mt-1"
              >
                Voir sur Explorer ↗
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => empireTxClear()}
            className="shrink-0 text-zinc-500 hover:text-white text-lg leading-none px-1"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        {(tx.phase === 'preparing' || tx.phase === 'signing' || tx.phase === 'broadcast') && (
          <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-violet-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}

function useSendTxBridge() {
  const tryInject = useCallback(async () => {
    const w = window as unknown as {
      __xartistsSendTx?: (
        txs: unknown[],
        info?: { processingMessage?: string; successMessage?: string; errorMessage?: string },
      ) => Promise<{ sessionId?: string }>
    }

    if (typeof w.__xartistsSendTx === 'function') return

    try {
      const mod = await import('@multiversx/sdk-dapp/services/transactions/sendTransactions')
      const sendTransactions = (mod as { sendTransactions?: Function }).sendTransactions
      if (typeof sendTransactions !== 'function') return

      w.__xartistsSendTx = async (txs, info) => {
        const label = info?.processingMessage || 'Transaction MultiversX'
        empireTxStart(label)
        empireTxSigning()
        try {
          const result = await sendTransactions({
            transactions: txs,
            transactionsDisplayInfo: {
              processingMessage: info?.processingMessage,
              successMessage: info?.successMessage,
              errorMessage: info?.errorMessage,
            },
          })
          const sessionId =
            (result as { sessionId?: string })?.sessionId ??
            (typeof result === 'string' ? result : 'submitted')
          empireTxBroadcast(sessionId)
          const url = sessionId && sessionId !== 'submitted'
            ? `${EXPLORER}/transactions/${sessionId}`
            : null
          empireTxSuccess(sessionId, url ?? undefined)
          return { sessionId }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'send failed'
          empireTxError(msg)
          throw e
        }
      }
    } catch {
      /* sdk-dapp path unavailable */
    }
  }, [])

  useEffect(() => {
    void tryInject()
  }, [tryInject])
}

export default function TxShell({ children }: { children: ReactNode }) {
  useSendTxBridge()
  return (
    <>
      {children}
      <TransactionOverlay />
    </>
  )
}

/** Listen empire TX errors → txLog (no silent failures) */
import { useEffect } from 'react'
import { subscribeEmpire, getEmpireState } from '../store/empireStore'
import { logTxFailure } from '../lib/txLog'

export default function TransactionMonitor() {
  useEffect(() => {
    let lastError: string | null = null
    const unsub = subscribeEmpire(() => {
      const tx = getEmpireState().tx
      if (tx.phase === 'error' && tx.error && tx.error !== lastError) {
        lastError = tx.error
        logTxFailure(tx.label || 'tx', tx.error, tx.sessionId)
      }
      if (tx.phase === 'idle' || tx.phase === 'success') lastError = null
    })
    const onReject = (e: PromiseRejectionEvent) => {
      const msg = e.reason instanceof Error ? e.reason.message : String(e.reason || '')
      if (/tx|transaction|gas|sign|contract|multiversx|wallet/i.test(msg)) {
        logTxFailure('unhandled-rejection', msg)
      }
    }
    window.addEventListener('unhandledrejection', onReject)
    return () => {
      unsub()
      window.removeEventListener('unhandledrejection', onReject)
    }
  }, [])
  return null
}

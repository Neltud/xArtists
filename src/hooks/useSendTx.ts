/**
 * Unified send + error handling for MultiversX txs
 */
import { useCallback, useRef, useState } from 'react'
import type { Transaction } from '@multiversx/sdk-core'
import {
  classifyTxError,
  explorerTxUrl,
  waitTxStatus,
  type ClassifiedTxError,
  type TxPhase,
  type TxStatusState,
} from '../services/txErrors'

export type SendTxResult =
  | { ok: true; hash: string; explorerUrl: string }
  | { ok: false; error: ClassifiedTxError }

async function trySdkDappSend(tx: Transaction): Promise<string> {
  // Dynamic import — works when @multiversx/sdk-dapp is present
  try {
    const mod = await import('@multiversx/sdk-dapp/services')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const send = (mod as any).sendTransactions || (mod as any).default?.sendTransactions
    if (typeof send === 'function') {
      const res = await send({
        transactions: [tx],
        transactionsDisplayInfo: {
          processingMessage: 'Envoi de la transaction…',
          errorMessage: 'Échec de la transaction',
          successMessage: 'Transaction envoyée',
        },
      })
      const hashes = res?.hashes || res?.sessionId || res
      if (Array.isArray(hashes) && hashes[0]) return String(hashes[0])
      if (typeof hashes === 'string') return hashes
      if (hashes && typeof hashes === 'object') {
        const first = Object.values(hashes)[0]
        if (first) return String(first)
      }
      throw new Error('sendTransactions: no hash returned')
    }
  } catch (e) {
    // If module missing, fall through
    if (e && typeof e === 'object' && 'code' in (e as object)) throw e
    const msg = e instanceof Error ? e.message : String(e)
    if (!/Cannot find module|Failed to fetch dynamically/i.test(msg)) throw e
  }
  throw new Error(
    'sdk-dapp sendTransactions indisponible — utilise le provider wallet ou installe @multiversx/sdk-dapp'
  )
}

export function useSendTx() {
  const [state, setState] = useState<TxStatusState>({ phase: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ phase: 'idle' })
  }, [])

  const setPhase = (phase: TxPhase, patch: Partial<TxStatusState> = {}) => {
    setState((s) => ({ ...s, phase, ...patch }))
  }

  const send = useCallback(async (tx: Transaction): Promise<SendTxResult> => {
    setPhase('signing', { error: null, message: 'Signature wallet…' })
    try {
      const hash = await trySdkDappSend(tx)
      const explorerUrl = explorerTxUrl(hash)
      setPhase('broadcasting', { hash, explorerUrl, message: 'Diffusion…' })

      abortRef.current = new AbortController()
      setPhase('pending', { hash, explorerUrl, message: 'En attente de confirmation…' })

      const wait = await waitTxStatus(hash, { signal: abortRef.current.signal })
      if (wait.status === 'success') {
        setPhase('success', {
          hash,
          explorerUrl,
          message: 'Transaction confirmée',
          error: null,
        })
        return { ok: true, hash, explorerUrl }
      }
      if (wait.status === 'fail') {
        const returnMsg =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (wait.raw as any)?.returnMessage ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (wait.raw as any)?.operations?.[0]?.data ||
          'TX failed on-chain'
        const error = classifyTxError(returnMsg, 'failed')
        setPhase('failed', { hash, explorerUrl, error, message: error.message })
        return { ok: false, error }
      }
      // timeout — tx may still confirm later
      const error = classifyTxError('timeout waiting for confirmation', 'pending')
      setPhase('pending', {
        hash,
        explorerUrl,
        error,
        message: 'Timeout — vérifie l’explorer, la TX peut encore confirmer.',
      })
      return { ok: false, error }
    } catch (e) {
      const error = classifyTxError(e, 'failed')
      setPhase(error.phase === 'cancelled' ? 'cancelled' : 'failed', {
        error,
        message: error.message,
      })
      return { ok: false, error }
    }
  }, [])

  return { state, send, reset, setPhase }
}

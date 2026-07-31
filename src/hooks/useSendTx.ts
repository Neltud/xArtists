/**
 * Unified send: nonce refresh + concurrency lock + error handling
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
import { getFreshNonce, waitNonceAdvanced } from '../services/nonce'
import { txQueue, TxConcurrencyError } from '../services/txQueue'

export type SendTxResult =
  | { ok: true; hash: string; explorerUrl: string; nonce: number }
  | { ok: false; error: ClassifiedTxError }

export type SendTxOptions = {
  refreshNonce?: boolean
  waitNonceAdvance?: boolean
  address?: string
  /** If false, reject when another TX is in flight (default: queue) */
  queue?: boolean
  label?: string
}

async function trySdkDappSend(tx: Transaction): Promise<string> {
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
    if (e && typeof e === 'object' && 'code' in (e as object)) throw e
    const msg = e instanceof Error ? e.message : String(e)
    if (!/Cannot find module|Failed to fetch dynamically/i.test(msg)) throw e
  }
  throw new Error(
    'sdk-dapp sendTransactions indisponible — xPortal / extension / web wallet requis'
  )
}

function readTxNonce(tx: Transaction): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n = (tx as any).getNonce?.() ?? (tx as any).nonce
    if (n != null && typeof n.valueOf === 'function') return Number(n.valueOf())
    return Number(n)
  } catch {
    return -1
  }
}

function patchTxNonce(tx: Transaction, nonce: number): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyTx = tx as any
    if (typeof anyTx.setNonce === 'function') anyTx.setNonce(nonce)
    else anyTx.nonce = nonce
  } catch {
    /* ignore */
  }
}

function readTxSender(tx: Transaction): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (tx as any).getSender?.() ?? (tx as any).sender
    if (!s) return null
    if (typeof s.bech32 === 'function') return s.bech32()
    return String(s)
  } catch {
    return null
  }
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

  const send = useCallback(
    async (tx: Transaction, options: SendTxOptions = {}): Promise<SendTxResult> => {
      const address = options.address || readTxSender(tx)
      if (!address) {
        const error = classifyTxError('sender address missing', 'failed')
        setPhase('failed', { error, message: error.message })
        return { ok: false, error }
      }

      if (options.queue === false && txQueue.isBusy(address)) {
        const error = classifyTxError(new TxConcurrencyError(), 'failed')
        setPhase('failed', { error, message: error.message })
        return { ok: false, error }
      }

      return txQueue.enqueue(
        address,
        async () => {
          const refreshNonce = options.refreshNonce !== false
          const waitAdvance = options.waitNonceAdvance !== false
          let usedNonce = readTxNonce(tx)

          try {
            if (refreshNonce) {
              setPhase('building', { error: null, message: 'Polling nonce…' })
              const fresh = await getFreshNonce(address, { stable: true })
              if (usedNonce !== fresh) {
                patchTxNonce(tx, fresh)
                usedNonce = fresh
              }
            }

            setPhase('signing', {
              error: null,
              message: `Signature (nonce ${usedNonce})…`,
            })
            const hash = await trySdkDappSend(tx)
            const explorerUrl = explorerTxUrl(hash)
            setPhase('broadcasting', { hash, explorerUrl, message: 'Diffusion…' })

            abortRef.current = new AbortController()
            setPhase('pending', {
              hash,
              explorerUrl,
              message: 'Confirmation on-chain…',
            })

            const wait = await waitTxStatus(hash, {
              signal: abortRef.current.signal,
              timeoutMs: 120_000,
            })

            if (wait.status === 'success') {
              if (waitAdvance && usedNonce >= 0) {
                try {
                  setPhase('pending', {
                    hash,
                    explorerUrl,
                    message: 'Avancement nonce…',
                  })
                  await waitNonceAdvanced(address, usedNonce, {
                    signal: abortRef.current.signal,
                  })
                } catch {
                  /* non-fatal */
                }
              }
              setPhase('success', {
                hash,
                explorerUrl,
                message: `Confirmée (nonce ${usedNonce})`,
                error: null,
              })
              return { ok: true, hash, explorerUrl, nonce: usedNonce }
            }

            if (wait.status === 'fail') {
              const returnMsg =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (wait.raw as any)?.returnMessage || 'TX failed on-chain'
              const error = classifyTxError(returnMsg, 'failed')
              if (error.code === 'WRONG_NONCE') {
                error.message =
                  'Nonce incorrect — le prochain envoi re-pollera automatiquement.'
                error.retryable = true
              }
              setPhase('failed', { hash, explorerUrl, error, message: error.message })
              return { ok: false, error }
            }

            const error = classifyTxError(
              'timeout waiting for confirmation',
              'pending'
            )
            setPhase('pending', {
              hash,
              explorerUrl,
              error,
              message: 'Timeout confirmation — vérifie l’explorer.',
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
        },
        options.label || 'send'
      )
    },
    []
  )

  const pollNonce = useCallback(async (address: string) => {
    return getFreshNonce(address, { stable: true })
  }, [])

  return {
    state,
    send,
    reset,
    setPhase,
    pollNonce,
    isQueueBusy: (addr: string) => txQueue.isBusy(addr),
  }
}

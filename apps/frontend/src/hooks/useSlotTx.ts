/**
 * Slot casino SC — spinEgld / resolveSpin / refundSpin.
 * Hard-gated by canSpinSlot() (VITE_SLOT_CASINO_CODEHASH_OK=1).
 * Provably fair: client_seed → lock → resolve after delay blocks.
 */
import { useCallback, useState } from 'react'
import { useSendTransaction } from './useSendTransaction'
import {
  canSpinSlot,
  slotCasinoReceiverOrThrow,
  SLOT_CASINO_ADDRESS,
} from '../config/scStatus'

function egldToAtomic(egld: number): string {
  return BigInt(Math.round(egld * 1e18)).toString()
}

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function numToHex(n: number | bigint): string {
  const h = BigInt(n).toString(16)
  return h.length % 2 === 0 ? h : `0${h}`
}

function randomClientSeed(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

const BLOCKED =
  'Slot SC gated — set VITE_SLOT_CASINO_CODEHASH_OK=1 + fund progressive before on-chain spin.'

export function useSlotTx() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const [lastSeed, setLastSeed] = useState<string | null>(null)
  const { send } = useSendTransaction()
  const live = canSpinSlot()

  const run = useCallback(
    async (
      tx: object,
      labels: { processing: string; success: string; fail: string },
    ) => {
      if (!live) {
        setError(BLOCKED)
        throw new Error(BLOCKED)
      }
      let receiver: string
      try {
        receiver = slotCasinoReceiverOrThrow()
      } catch (e) {
        const msg = e instanceof Error ? e.message : BLOCKED
        setError(msg)
        throw new Error(msg)
      }
      setPending(true)
      setError(null)
      try {
        const res = await send([{ ...(tx as object), receiver }], {
          processingMessage: labels.processing,
          successMessage: labels.success,
          errorMessage: labels.fail,
        })
        if (res.error) {
          setError(res.error)
          throw new Error(res.error)
        }
        setLastTx(res.sessionId)
        return res
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : labels.fail
        setError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [send, live],
  )

  /**
   * spinEgld — payable EGLD + client_seed (hex string in data).
   * Creates pending spin; user must later resolveSpin(spinId).
   */
  const spinEgld = useCallback(
    async (betEgld: number, clientSeed?: string) => {
      if (!(betEgld > 0)) {
        const msg = 'Mise invalide'
        setError(msg)
        throw new Error(msg)
      }
      const seed = (clientSeed || randomClientSeed()).slice(0, 64)
      setLastSeed(seed)
      return run(
        {
          value: egldToAtomic(betEgld),
          gasLimit: 20_000_000,
          data: `spinEgld@${strToHex(seed)}`,
          chainID: '1',
        },
        {
          processing: 'Spin on-chain…',
          success: 'Spin locked — resolve après delay',
          fail: 'Spin SC failed',
        },
      )
    },
    [run],
  )

  const resolveSpin = useCallback(
    async (spinId: number) =>
      run(
        {
          value: '0',
          gasLimit: 25_000_000,
          data: `resolveSpin@${numToHex(spinId)}`,
          chainID: '1',
        },
        {
          processing: 'Resolve spin…',
          success: 'Resolved',
          fail: 'Resolve failed',
        },
      ),
    [run],
  )

  const refundSpin = useCallback(
    async (spinId: number) =>
      run(
        {
          value: '0',
          gasLimit: 15_000_000,
          data: `refundSpin@${numToHex(spinId)}`,
          chainID: '1',
        },
        {
          processing: 'Refund…',
          success: 'Refunded',
          fail: 'Refund failed',
        },
      ),
    [run],
  )

  return {
    spinEgld,
    resolveSpin,
    refundSpin,
    pending,
    error,
    lastTx,
    lastSeed,
    slotLive: live,
    slotAddress: live ? SLOT_CASINO_ADDRESS : '',
  }
}

/**
 * Slot SC — deployed bytecode endpoints include: spinEgld, spinEsdt, resolveSpin, refundSpin,
 * fundProgressiveEgld, claimHouseEgld…
 *
 * Mainnet probe 2026-10-03: spinEgld@seed + EGLD value → "ESDT expected" (payment path bug).
 * Until SC upgrade, real spins stay blocked with honest error; paper mode remains UI.
 */
import { useCallback, useState } from 'react'
import { useSendTransaction } from './useSendTransaction'
import {
  canSpinSlot,
  slotReceiverOrThrow,
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

/** Deployed spinEgld rejects pure EGLD with ESDT expected — do not expose as working. */
export const SLOT_SPIN_EGLD_BROKEN =
  'Slot on-chain: spinEgld renvoie « ESDT expected » (bug bytecode). Upgrade SC requis. Utilise le mode Fun (paper).'

const BLOCKED =
  'Slot SC non ouvert — paper / simulation uniquement pour l’instant.'

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
      try {
        slotReceiverOrThrow()
      } catch (e) {
        const msg = e instanceof Error ? e.message : BLOCKED
        setError(msg)
        throw new Error(msg)
      }
      setPending(true)
      setError(null)
      try {
        const res = await send([{ ...(tx as object), receiver: slotReceiverOrThrow() }], {
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

  const spinEgld = useCallback(
    async (_betEgld: number, _clientSeed?: string) => {
      // Honest block — avoids burning user gas on known-broken path
      setError(SLOT_SPIN_EGLD_BROKEN)
      throw new Error(SLOT_SPIN_EGLD_BROKEN)
    },
    [],
  )

  /** Experimental — only after SC upgrade verified */
  const spinEgldRaw = useCallback(
    async (betEgld: number, clientSeed?: string) => {
      if (!(betEgld > 0)) throw new Error('Mise invalide')
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
          success: 'Spin soumis',
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
        { processing: 'Resolve…', success: 'Resolved', fail: 'Resolve failed' },
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
        { processing: 'Refund…', success: 'Refunded', fail: 'Refund failed' },
      ),
    [run],
  )

  return {
    spinEgld,
    spinEgldRaw,
    resolveSpin,
    refundSpin,
    pending,
    error,
    lastTx,
    lastSeed,
    slotLive: live,
    slotSpinBroken: true as const,
    slotAddress: live ? SLOT_CASINO_ADDRESS : '',
  }
}

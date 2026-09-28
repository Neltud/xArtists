/**
 * Venue-split rentPay — hard-blocked until VITE_VENUE_CODEHASH_OK + address.
 * Paper path: dispatch VENUE_RENT_PAY intent only (no funds to SC).
 */
import { useCallback, useState } from 'react'
import { useSendTransaction } from './useSendTransaction'
import {
  isVenueLive,
  venueReceiverOrThrow,
  VENUE_SC_ADDRESS,
} from '../lib/scStatus'
import { dispatch8008 } from '../config/agent8008'

function egldToAtomic(egld: number): string {
  return BigInt(Math.round(egld * 1e18)).toString()
}

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

const BLOCKED =
  'Venue-split SC not live (codeHash). Paper only until VITE_VENUE_SC_ADDRESS + VITE_VENUE_CODEHASH_OK=1.'

export function useVenueRentTx() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const { send } = useSendTransaction()
  const live = isVenueLive()

  /** Paper: journal 8008 only — never sends EGLD */
  const rentPayPaper = useCallback(
    (tierId: string, amountEgld: number, meta: Record<string, unknown> = {}) => {
      dispatch8008('VENUE_RENT_PAY', {
        tier_id: tierId,
        amount_egld: amountEgld,
        paper: true,
        sc_address: VENUE_SC_ADDRESS || null,
        live: false,
        ...meta,
        raw: `VENUE_RENT_PAY paper ${tierId} ${amountEgld}EGLD`,
      })
      return { paper: true as const }
    },
    [],
  )

  /** On-chain rentPay — throws if not live */
  const rentPayLive = useCallback(
    async (tierId: string, amountEgld: number) => {
      if (!live) {
        setError(BLOCKED)
        throw new Error(BLOCKED)
      }
      if (amountEgld <= 0) {
        throw new Error('amount must be > 0')
      }
      let receiver: string
      try {
        receiver = venueReceiverOrThrow()
      } catch (e) {
        const msg = e instanceof Error ? e.message : BLOCKED
        setError(msg)
        throw new Error(msg)
      }

      const data = `rentPay@${strToHex(tierId)}`
      setPending(true)
      setError(null)
      try {
        const res = await send(
          [
            {
              receiver,
              value: egldToAtomic(amountEgld),
              gasLimit: 15_000_000,
              data,
            },
          ],
          {
            processingMessage: 'Venue rentPay…',
            successMessage: 'Rent paid on-chain',
            errorMessage: 'rentPay failed',
          },
        )
        const hash =
          (res as { transactions?: { hash?: string }[] })?.transactions?.[0]?.hash || null
        setLastTx(hash)
        dispatch8008('VENUE_RENT_PAY', {
          tier_id: tierId,
          amount_egld: amountEgld,
          paper: false,
          tx: hash,
          sc_address: receiver,
          raw: `VENUE_RENT_PAY live ${tierId}`,
        })
        return res
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'rentPay failed'
        setError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [live, send],
  )

  /** Prefer live if flag OK, else paper */
  const rentPay = useCallback(
    async (tierId: string, amountEgld: number, meta?: Record<string, unknown>) => {
      if (live) return rentPayLive(tierId, amountEgld)
      return rentPayPaper(tierId, amountEgld, meta)
    },
    [live, rentPayLive, rentPayPaper],
  )

  return {
    live,
    pending,
    error,
    lastTx,
    venueAddress: VENUE_SC_ADDRESS,
    rentPay,
    rentPayPaper,
    rentPayLive,
  }
}

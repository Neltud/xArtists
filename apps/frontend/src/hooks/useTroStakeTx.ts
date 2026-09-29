/**
 * TRO stake / unstake — hard-blocked while canStakeTro() is false.
 * Receiver always from live address — never placeholder.
 * TRO-94c925 has 6 decimals on MultiversX mainnet.
 */
import { useCallback, useState } from 'react'
import { useSendTransaction } from './useSendTransaction'
import {
  canStakeTro,
  troStakingReceiverOrThrow,
  TRO_TOKEN_ID,
} from '../lib/scStatus'
import {
  empireTxStart,
  empireTxError,
  empireTxClear,
} from '../store/empireStore'

/** TRO-94c925 decimals (api.multiversx.com/tokens/TRO-94c925) */
const TRO_DECIMALS = 6

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function numToHex(n: number | bigint): string {
  const h = BigInt(n).toString(16)
  return h.length % 2 === 0 ? h : `0${h}`
}

function troToAtomic(amount: number): bigint {
  const factor = 10 ** TRO_DECIMALS
  return BigInt(Math.round(amount * factor))
}

const BLOCKED =
  'TRO staking SC not live (codeHash). Deploy + VITE_TRO_STAKING_CODEHASH_OK=1 before stake.'

export function useTroStakeTx() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const { send } = useSendTransaction()
  const live = canStakeTro()

  const stake = useCallback(
    async (amountTro: number) => {
      if (!live) {
        setError(BLOCKED)
        empireTxError(BLOCKED)
        throw new Error(BLOCKED)
      }
      if (!(amountTro > 0)) {
        const msg = 'Montant TRO invalide'
        setError(msg)
        throw new Error(msg)
      }

      setPending(true)
      setError(null)
      empireTxStart(`Stake ${amountTro} TRO`)

      try {
        const receiver = troStakingReceiverOrThrow()
        const atomic = troToAtomic(amountTro)
        // ESDTTransfer@token@amount@stake
        const data = [
          'ESDTTransfer',
          strToHex(TRO_TOKEN_ID),
          numToHex(atomic),
          strToHex('stake'),
        ].join('@')

        const tx = {
          receiver,
          value: '0',
          data,
          gasLimit: 12_000_000,
        }

        const res = await send([tx], {
          processingMessage: `Stake ${amountTro} TRO…`,
          successMessage: 'Stake confirmé',
          errorMessage: 'Échec stake TRO',
        })

        if (res.error) {
          setError(res.error)
          empireTxError(res.error)
          return { ok: false as const, error: res.error }
        }
        setLastTx(res.sessionId)
        return { ok: true as const, sessionId: res.sessionId }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'stake failed'
        setError(msg)
        empireTxError(msg)
        return { ok: false as const, error: msg }
      } finally {
        setPending(false)
      }
    },
    [live, send],
  )

  const unstake = useCallback(
    async (amountTro: number) => {
      if (!live) {
        setError(BLOCKED)
        empireTxError(BLOCKED)
        throw new Error(BLOCKED)
      }
      if (!(amountTro > 0)) {
        const msg = 'Montant TRO invalide'
        setError(msg)
        throw new Error(msg)
      }

      setPending(true)
      setError(null)
      empireTxStart(`Unstake ${amountTro} TRO`)

      try {
        const receiver = troStakingReceiverOrThrow()
        const atomic = troToAtomic(amountTro)
        // unstake@amount
        const data = ['unstake', numToHex(atomic)].join('@')

        const tx = {
          receiver,
          value: '0',
          data,
          gasLimit: 12_000_000,
        }

        const res = await send([tx], {
          processingMessage: `Unstake ${amountTro} TRO…`,
          successMessage: 'Unstake confirmé',
          errorMessage: 'Échec unstake TRO',
        })

        if (res.error) {
          setError(res.error)
          empireTxError(res.error)
          return { ok: false as const, error: res.error }
        }
        setLastTx(res.sessionId)
        return { ok: true as const, sessionId: res.sessionId }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'unstake failed'
        setError(msg)
        empireTxError(msg)
        return { ok: false as const, error: msg }
      } finally {
        setPending(false)
      }
    },
    [live, send],
  )

  const clear = useCallback(() => {
    setError(null)
    setLastTx(null)
    empireTxClear()
  }, [])

  return { stake, unstake, pending, error, lastTx, live, clear }
}

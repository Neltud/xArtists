/**
 * Burn $TRO via xArtists tro-burn: ESDTTransfer → burnTro → EGLD reward.
 * Protocol fee → LIA reward_wallet. Pool via fundRewards.
 */
import { useCallback, useState } from 'react'
import { useSendTransaction } from './useSendTransaction'

const TRO_ID = (import.meta.env.VITE_TRO_TOKEN_ID as string) || 'TRO-94c925'
const BURN_SC = (import.meta.env.VITE_TRO_BURN_ADDRESS as string) || ''
const LIVE =
  import.meta.env.VITE_TRO_BURN_CODEHASH_OK === '1' ||
  import.meta.env.VITE_TRO_BURN_CODEHASH_OK === 'true'
const TRO_DECIMALS = Number(import.meta.env.VITE_TRO_DECIMALS || 6)
const EGLD_PER_TRO_HINT = import.meta.env.VITE_TRO_BURN_EGLD_PER_TRO || '0'

function strToHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function amountToAtomic(human: number): string {
  const f = Math.pow(10, TRO_DECIMALS)
  return BigInt(Math.round(human * f)).toString()
}

function numToHex(n: string | number | bigint): string {
  const h = BigInt(n).toString(16)
  return h.length % 2 === 0 ? h : `0${h}`
}

const BLOCKED =
  'tro-burn SC not live. Deploy, ESDTLocalBurn, fundRewards, VITE_TRO_BURN_*.'

export function isTroBurnLive(): boolean {
  return LIVE && Boolean(BURN_SC.startsWith('erd1'))
}

export function useBurnTro() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const { send } = useSendTransaction()

  const burnTro = useCallback(
    async (amountHuman: number) => {
      if (!isTroBurnLive()) {
        setError(BLOCKED)
        throw new Error(BLOCKED)
      }
      if (!amountHuman || amountHuman <= 0) throw new Error('Amount must be > 0')
      const atomic = amountToAtomic(amountHuman)
      const data = ['ESDTTransfer', strToHex(TRO_ID), numToHex(atomic), strToHex('burnTro')].join(
        '@'
      )
      setPending(true)
      setError(null)
      try {
        const res = await send(
          [{ value: '0', data, receiver: BURN_SC, gasLimit: 15_000_000, chainID: '1' }],
          {
            processingMessage: `Burn ${amountHuman} $TRO…`,
            successMessage: 'Burn + reward submitted',
            errorMessage: 'Burn failed',
          }
        )
        if (res.error) {
          setError(res.error)
          throw new Error(res.error)
        }
        setLastTx(res.sessionId)
        return res
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Burn failed'
        setError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [send]
  )

  const fundRewards = useCallback(
    async (egldAmount: number) => {
      if (!isTroBurnLive()) {
        setError(BLOCKED)
        throw new Error(BLOCKED)
      }
      if (!egldAmount || egldAmount <= 0) throw new Error('EGLD amount > 0')
      const value = BigInt(Math.round(egldAmount * 1e18)).toString()
      setPending(true)
      setError(null)
      try {
        const res = await send(
          [
            {
              value,
              data: strToHex('fundRewards'),
              receiver: BURN_SC,
              gasLimit: 6_000_000,
              chainID: '1',
            },
          ],
          {
            processingMessage: `Fund pool ${egldAmount} EGLD…`,
            successMessage: 'Pool funded',
            errorMessage: 'Fund failed',
          }
        )
        if (res.error) {
          setError(res.error)
          throw new Error(res.error)
        }
        setLastTx(res.sessionId)
        return res
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Fund failed'
        setError(msg)
        throw e
      } finally {
        setPending(false)
      }
    },
    [send]
  )

  return {
    burnTro,
    fundRewards,
    pending,
    error,
    lastTx,
    live: isTroBurnLive(),
    scAddress: BURN_SC || null,
    tokenId: TRO_ID,
    decimals: TRO_DECIMALS,
    egldPerTroHint: EGLD_PER_TRO_HINT,
  }
}

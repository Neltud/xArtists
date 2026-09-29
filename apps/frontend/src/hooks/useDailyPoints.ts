/**
 * Points quotidiens — claim on-chain (memo TX) + mirror localStorage.
 * +1 pt / jour · +3 pts serie 7 j. Exige wallet signant.
 */
import { useCallback, useEffect, useState } from 'react'
import { useWallet, LIA_WALLET } from '../context/WalletContext'
import { useSendTransaction } from './useSendTransaction'

const KEY_PREFIX = 'xartists_daily_points_v3_'

export type DailyPointsState = {
  totalPoints: number
  streak: number
  lastClaimDay: string | null
  history: { day: string; pts: number; kind: 'daily' | 'streak7'; tx?: string }[]
  lastTxHash: string | null
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const da = Date.parse(a + 'T00:00:00Z')
  const db = Date.parse(b + 'T00:00:00Z')
  return Math.round((db - da) / 86_400_000)
}

function storageKey(address: string | null): string {
  const a = (address || 'guest').toLowerCase()
  return KEY_PREFIX + a.slice(0, 16)
}

function load(address: string | null): DailyPointsState {
  try {
    const raw = localStorage.getItem(storageKey(address))
    if (!raw) {
      return { totalPoints: 0, streak: 0, lastClaimDay: null, history: [], lastTxHash: null }
    }
    return JSON.parse(raw) as DailyPointsState
  } catch {
    return { totalPoints: 0, streak: 0, lastClaimDay: null, history: [], lastTxHash: null }
  }
}

function save(address: string | null, s: DailyPointsState) {
  try {
    localStorage.setItem(storageKey(address), JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

/** Data field on-chain (memo) — visible explorer */
function claimData(day: string): string {
  return `xArtistsClaim@${day}`
}

export function useDailyPoints() {
  const { address, connected, canAttemptSign, method } = useWallet()
  const { send } = useSendTransaction()
  const scope = connected && address ? address : null

  const [state, setState] = useState<DailyPointsState>(() =>
    typeof window !== 'undefined'
      ? load(null)
      : { totalPoints: 0, streak: 0, lastClaimDay: null, history: [], lastTxHash: null },
  )
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  useEffect(() => {
    setState(load(scope))
  }, [scope])

  const canClaimToday =
    !!scope &&
    canAttemptSign &&
    method !== 'paste_readonly' &&
    (!state.lastClaimDay || state.lastClaimDay !== todayUtc())

  const claim = useCallback(async () => {
    setClaimError(null)
    if (!scope || !canAttemptSign) {
      setClaimError('Connecte xPortal / Web Wallet pour claim on-chain.')
      return
    }
    const day = todayUtc()
    if (state.lastClaimDay === day) {
      setClaimError('Deja reclame aujourd hui.')
      return
    }

    setClaiming(true)
    try {
      // Memo TX on-chain vers wallet protocole LIA (0 EGLD) — preuve publique du claim
      const res = await send(
        [
          {
            receiver: LIA_WALLET,
            value: '0',
            data: claimData(day),
            gasLimit: 100_000,
          },
        ],
        {
          processingMessage: `Claim points ${day}`,
          successMessage: 'Claim on-chain envoye',
          errorMessage: 'Claim echoue',
        },
      )

      if (res.error) {
        setClaimError(res.error)
        setClaiming(false)
        return
      }

      const txId = res.sessionId || 'submitted'

      setState(prev => {
        let streak = 1
        if (prev.lastClaimDay) {
          const gap = daysBetween(prev.lastClaimDay, day)
          if (gap === 1) streak = prev.streak + 1
          else streak = 1
        }

        let add = 1
        const history = [...prev.history, { day, pts: 1, kind: 'daily' as const, tx: txId }]

        if (streak > 0 && streak % 7 === 0) {
          add += 3
          history.push({ day, pts: 3, kind: 'streak7', tx: txId })
        }

        const next: DailyPointsState = {
          totalPoints: prev.totalPoints + add,
          streak,
          lastClaimDay: day,
          history: history.slice(-30),
          lastTxHash: txId,
        }
        save(scope, next)
        return next
      })
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : 'Claim failed')
    } finally {
      setClaiming(false)
    }
  }, [scope, canAttemptSign, state.lastClaimDay, send])

  return {
    ...state,
    canClaimToday,
    claim,
    claiming,
    claimError,
    scopedTo: scope,
    needsWallet: !scope || !canAttemptSign,
  }
}

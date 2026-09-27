/**
 * Parcours points — 1 pt / jour · +3 pts série 7 j.
 * Scopé par adresse wallet si connecté (sinon guest).
 */
import { useCallback, useEffect, useState } from 'react'
import { useWallet } from '../context/WalletContext'

const KEY_PREFIX = 'xartists_daily_points_v2_'

export type DailyPointsState = {
  totalPoints: number
  streak: number
  lastClaimDay: string | null
  history: { day: string; pts: number; kind: 'daily' | 'streak7' }[]
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
      return { totalPoints: 0, streak: 0, lastClaimDay: null, history: [] }
    }
    return JSON.parse(raw) as DailyPointsState
  } catch {
    return { totalPoints: 0, streak: 0, lastClaimDay: null, history: [] }
  }
}

function save(address: string | null, s: DailyPointsState) {
  try {
    localStorage.setItem(storageKey(address), JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

export function useDailyPoints() {
  const { address, connected } = useWallet()
  const scope = connected && address ? address : null

  const [state, setState] = useState<DailyPointsState>(() =>
    typeof window !== 'undefined'
      ? load(null)
      : { totalPoints: 0, streak: 0, lastClaimDay: null, history: [] },
  )

  useEffect(() => {
    setState(load(scope))
  }, [scope])

  const canClaimToday = !state.lastClaimDay || state.lastClaimDay !== todayUtc()

  const claim = useCallback(() => {
    const day = todayUtc()
    setState(prev => {
      if (prev.lastClaimDay === day) return prev

      let streak = 1
      if (prev.lastClaimDay) {
        const gap = daysBetween(prev.lastClaimDay, day)
        if (gap === 1) streak = prev.streak + 1
        else streak = 1
      }

      let add = 1
      const history = [...prev.history, { day, pts: 1, kind: 'daily' as const }]

      if (streak > 0 && streak % 7 === 0) {
        add += 3
        history.push({ day, pts: 3, kind: 'streak7' })
      }

      const next: DailyPointsState = {
        totalPoints: prev.totalPoints + add,
        streak,
        lastClaimDay: day,
        history: history.slice(-30),
      }
      save(scope, next)
      return next
    })
  }, [scope])

  return { ...state, canClaimToday, claim, scopedTo: scope }
}

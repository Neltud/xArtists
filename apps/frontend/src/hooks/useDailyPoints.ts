/**
 * Parcours points — 1 pt / connexion quotidienne · +3 pts série 7 jours.
 * localStorage only (paper).
 */
import { useCallback, useEffect, useState } from 'react'

const KEY = 'xartists_daily_points_v1'

export type DailyPointsState = {
  totalPoints: number
  streak: number
  lastClaimDay: string | null // YYYY-MM-DD UTC
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

function load(): DailyPointsState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return { totalPoints: 0, streak: 0, lastClaimDay: null, history: [] }
    }
    return JSON.parse(raw) as DailyPointsState
  } catch {
    return { totalPoints: 0, streak: 0, lastClaimDay: null, history: [] }
  }
}

function save(s: DailyPointsState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

export function useDailyPoints() {
  const [state, setState] = useState<DailyPointsState>(() =>
    typeof window !== 'undefined'
      ? load()
      : { totalPoints: 0, streak: 0, lastClaimDay: null, history: [] },
  )

  useEffect(() => {
    setState(load())
  }, [])

  const canClaimToday =
    !state.lastClaimDay || state.lastClaimDay !== todayUtc()

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
      save(next)
      return next
    })
  }, [])

  return { ...state, canClaimToday, claim }
}

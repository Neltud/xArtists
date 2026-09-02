/**
 * 365-day compounding scenarios for LIA-style trades.
 * Assumptions (transparent, not a guarantee):
 * - tradesPerDay default 5
 * - win: +gainPct (default +1%)
 * - loss: -lossPct (default -0.8%)
 */

export type WinRateScenario = {
  winRate: number
  label: string
  trades: number
  wins: number
  losses: number
  endValue: number
  multiple: number
}

export function project365(
  startUsd: number,
  winRate: number,
  opts?: {
    tradesPerDay?: number
    days?: number
    gainPct?: number
    lossPct?: number
  }
): WinRateScenario {
  const tradesPerDay = opts?.tradesPerDay ?? 5
  const days = opts?.days ?? 365
  const gain = 1 + (opts?.gainPct ?? 0.01)
  const loss = 1 - (opts?.lossPct ?? 0.008)
  const trades = tradesPerDay * days
  const w = Math.min(1, Math.max(0, winRate))
  const wins = Math.round(trades * w)
  const losses = trades - wins
  const start = Math.max(startUsd, 0)
  let end = start
  if (start > 0) {
    end = start * Math.pow(gain, wins) * Math.pow(loss, losses)
  }
  return {
    winRate: w,
    label: `${Math.round(w * 100)}% gagnants`,
    trades,
    wins,
    losses,
    endValue: end,
    multiple: start > 0 ? end / start : 0,
  }
}

export function defaultWinRateScenarios(startUsd: number): WinRateScenario[] {
  return [1, 0.9, 0.8, 0.5, 0.3].map(w => project365(startUsd, w))
}

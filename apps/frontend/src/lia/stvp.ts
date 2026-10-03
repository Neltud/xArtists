/**
 * Shadow Trading Validation Protocol (STVP) — 7-day ops tracker + KPI vs HODL.
 * Paper only.
 */

const KEY = 'xartists_lia_stvp_v1'

export type StvpDay = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type StvpState = {
  startedAt: number | null
  dayNotes: Partial<Record<StvpDay, string>>
  checkedDays: StvpDay[]
  /** Shadow equity mark (USDC-equivalent) at start */
  startEquityUsd: number
  /** EGLD units at start (for HODL bench) */
  startEgld: number
  startEgldPrice: number
}

const DEFAULT: StvpState = {
  startedAt: null,
  dayNotes: {},
  checkedDays: [],
  startEquityUsd: 0,
  startEgld: 0,
  startEgldPrice: 0,
}

export function loadStvp(): StvpState {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || 'null') as StvpState | null
    return j ? { ...DEFAULT, ...j } : { ...DEFAULT }
  } catch {
    return { ...DEFAULT }
  }
}

function save(s: StvpState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* */
  }
}

export function startStvp(opts: { equityUsd: number; egld: number; egldPrice: number }): StvpState {
  const s: StvpState = {
    startedAt: Date.now(),
    dayNotes: {},
    checkedDays: [],
    startEquityUsd: opts.equityUsd,
    startEgld: opts.egld,
    startEgldPrice: opts.egldPrice,
  }
  save(s)
  return s
}

export function markStvpDay(day: StvpDay, note?: string): StvpState {
  const s = loadStvp()
  if (!s.startedAt) return s
  if (!s.checkedDays.includes(day)) s.checkedDays = [...s.checkedDays, day].sort((a, b) => a - b) as StvpDay[]
  if (note) s.dayNotes = { ...s.dayNotes, [day]: note }
  save(s)
  return s
}

export function currentStvpDay(startedAt: number | null): StvpDay | 0 {
  if (!startedAt) return 0
  const d = Math.floor((Date.now() - startedAt) / 86_400_000) + 1
  if (d < 1) return 1
  if (d > 7) return 7
  return d as StvpDay
}

export type KpiSnapshot = {
  shadowEquityUsd: number
  hodlEquityUsd: number
  shadowRetPct: number
  hodlRetPct: number
  alphaPct: number
  /** shadow return - hodl return */
  passAlpha5: boolean
}

/** Compare shadow portfolio to buy&hold EGLD from STVP start. */
export function computeKpi(opts: {
  stvp: StvpState
  shadowEgld: number
  shadowUsdc: number
  shadowTro: number
  troUsd?: number
  egldPriceUsd: number
}): KpiSnapshot {
  const troUsd = opts.troUsd ?? 0
  const shadowEquityUsd =
    opts.shadowEgld * opts.egldPriceUsd + opts.shadowUsdc + opts.shadowTro * troUsd
  const hodlEquityUsd =
    opts.stvp.startEgld > 0 && opts.stvp.startEgldPrice > 0
      ? opts.stvp.startEgld * opts.egldPriceUsd +
        Math.max(0, opts.stvp.startEquityUsd - opts.stvp.startEgld * opts.stvp.startEgldPrice)
      : opts.stvp.startEquityUsd
  const base = opts.stvp.startEquityUsd || 1
  const shadowRetPct = ((shadowEquityUsd - base) / base) * 100
  const hodlRetPct = ((hodlEquityUsd - base) / base) * 100
  const alphaPct = shadowRetPct - hodlRetPct
  return {
    shadowEquityUsd,
    hodlEquityUsd,
    shadowRetPct,
    hodlRetPct,
    alphaPct,
    passAlpha5: alphaPct >= 5,
  }
}

export const STVP_DAY_LABELS: Record<StvpDay, string> = {
  1: 'J1–2 · Stabilité',
  2: 'J1–2 · Logique',
  3: 'J3–4 · Signaux',
  4: 'J3–4 · Précision',
  5: 'J5–6 · Volatilité',
  6: 'J5–6 · Protection',
  7: 'J7 · Audit KPI',
}

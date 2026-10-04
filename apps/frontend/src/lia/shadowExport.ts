/**
 * Task 2 — Export shadow treasury snapshot (browser) for aggregator / ops.
 * Friction already applied in shadowLedger; this serializes proof state.
 */
import { loadShadowBalances, loadShadowLog, type ShadowBalances, type ShadowFill } from './shadowLedger'

export type ShadowSnapshot = {
  schema: 'lia_shadow_local/v1'
  paper: true
  ts: string
  balances: ShadowBalances
  fills: number
  last: ShadowFill[]
  /** Rough equity: USDC + EGLD*lastPx + TRO*0 (no TRO oracle in browser) */
  equity_hint_usd: number
  friction_model: {
    gas_egld_per_fill: number
    slippage: 'liquidity_impact_0.05pct_to_2.5pct'
  }
}

export function buildShadowSnapshot(egldUsd = 0): ShadowSnapshot {
  const balances = loadShadowBalances()
  const last = loadShadowLog(12)
  const equity = balances.USDC + balances.EGLD * (egldUsd > 0 ? egldUsd : 0)
  return {
    schema: 'lia_shadow_local/v1',
    paper: true,
    ts: new Date().toISOString(),
    balances,
    fills: last.length,
    last,
    equity_hint_usd: Math.round(equity * 100) / 100,
    friction_model: {
      gas_egld_per_fill: 0.0008,
      slippage: 'liquidity_impact_0.05pct_to_2.5pct',
    },
  }
}

/** Persist last export for optional paste into Vellum / debug */
const EXPORT_KEY = 'xartists_lia_shadow_export_v1'

export function persistShadowExport(egldUsd = 0): ShadowSnapshot {
  const snap = buildShadowSnapshot(egldUsd)
  try {
    localStorage.setItem(EXPORT_KEY, JSON.stringify(snap))
  } catch {
    /* */
  }
  return snap
}

export function loadLastShadowExport(): ShadowSnapshot | null {
  try {
    const j = JSON.parse(localStorage.getItem(EXPORT_KEY) || 'null')
    return j && typeof j === 'object' ? (j as ShadowSnapshot) : null
  } catch {
    return null
  }
}

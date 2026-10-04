/**
 * LIA Decision Cycle — Scan → Score → Select → Validate → Execute(paper).
 * REAL execution is hard-blocked.
 */
import type { Intent, Matrix10, StrategyId } from './types'
import { STRATEGY_AURA } from './types'
import { intentActionFor, selectStrategy } from './strategySwitcher'
import { applyShadowIntent, type ShadowFill } from './shadowLedger'
import { pushIntentFeed } from './intentFeed'

export type CycleResult = {
  matrix: Matrix10
  strategy: StrategyId
  reason: string
  intent: Intent
  fill: ShadowFill | null
  aura: (typeof STRATEGY_AURA)[StrategyId]
  blocked?: string
}

/** Build a minimal matrix from Pulse-like uniforms (frontend bridge). */
export function matrixFromPulse(opts: {
  assetId?: string
  price?: number
  sentiment?: number
  volatility?: number
  confidence?: number
  rce?: number
}): Matrix10 {
  const s = opts.sentiment ?? 0
  const trend = s > 0.2 ? 'UP' : s < -0.2 ? 'DOWN' : 'SIDEWAYS'
  return {
    timeframe: 'H1',
    price: opts.price ?? 0,
    volatility: Math.min(1, Math.max(0, opts.volatility ?? 0.3)),
    liquidity: 0.5,
    rce: opts.rce ?? 0,
    sentiment: Math.min(1, Math.max(0, (s + 1) / 2)),
    trend,
    distance: Math.min(1, Math.abs(s)),
    confidence: Math.min(1, Math.max(0, opts.confidence ?? 0.5)),
    assetState: 'Liquid',
    assetId: opts.assetId || 'EGLD',
  }
}

function riskValidate(m: Matrix10, amount: number): string | null {
  if (m.rce > 0 && amount > m.rce * 0.1) return 'size_gt_10pct_rce'
  if (m.liquidity < 0.05 && amount > 0) return 'liquidity_too_low'
  return null
}

/**
 * One tick of the decision engine — paper only.
 */
export function runDecisionCycle(matrix: Matrix10, opts?: { executeShadow?: boolean }): CycleResult {
  const { strategy, reason } = selectStrategy(matrix)
  const action = intentActionFor(strategy, matrix)
  const amount =
    action === 'HOLD' || action === 'FLATTEN'
      ? 0
      : Math.max(0.01, Math.min(0.5, matrix.price > 0 ? 0.1 : 0.1))

  const block = riskValidate(matrix, amount)
  const intent: Intent = {
    id: `intent_${Date.now().toString(36)}`,
    strategy,
    action: block ? 'HOLD' : action,
    assetId: matrix.assetId,
    amount: block ? 0 : amount,
    priceHint: matrix.price,
    confidence: matrix.confidence,
    paper: true,
    reason: block ? `${reason}|blocked:${block}` : reason,
    at: Date.now(),
  }

  let fill: ShadowFill | null = null
  if (!block && opts?.executeShadow !== false && intent.action !== 'HOLD') {
    fill = applyShadowIntent({
      strategy,
      side:
        intent.action === 'BUY'
          ? 'BUY'
          : intent.action === 'SELL'
            ? 'SELL'
            : intent.action === 'STAKE'
              ? 'STAKE'
              : intent.action === 'COMPOUND'
                ? 'COMPOUND'
                : intent.action === 'FLATTEN'
                  ? 'FLATTEN'
                  : 'HOLD',
      asset: matrix.assetId,
      amount: intent.amount,
      price: matrix.price || 1,
      liquidity: matrix.liquidity,
    })
  }

  const aura = STRATEGY_AURA[strategy]
  // Task 3 — always log paper intent to feed
  try {
    pushIntentFeed(intent, aura)
  } catch {
    /* */
  }

  return {
    matrix,
    strategy,
    reason: intent.reason,
    intent,
    fill,
    aura,
    blocked: block || undefined,
  }
}

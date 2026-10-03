/**
 * LIA perception + strategy types (paper / shadow only).
 * Source: MSM-V1 + MSAB-V1 — execution REAL remains OFF.
 */

export type Timeframe = 'M5' | 'H1' | 'D1'
export type Trend = 'UP' | 'DOWN' | 'SIDEWAYS'
export type AssetState = 'Liquid' | 'Staked' | 'Locked' | 'Burned'

/** 10-column matrix (MSM / STVP) */
export type Matrix10 = {
  timeframe: Timeframe
  price: number
  volatility: number
  liquidity: number
  rce: number
  sentiment: number
  trend: Trend
  distance: number
  confidence: number
  assetState: AssetState
  assetId: string
}

export type StrategyId =
  | 'STRAT_YIELD_OPTIMIZER'
  | 'STRAT_COMPOUND_MAX'
  | 'STRAT_ARB_MARKET'
  | 'STRAT_TREND_FOLLOW'
  | 'STRAT_MEAN_REVERSION'
  | 'STRAT_DELTA_NEUTRAL'
  | 'STRAT_CORRELATION_ARB'
  | 'STRAT_LIQUIDITY_SNIPER'
  | 'STRAT_SENTIMENT_DIV'
  | 'STRAT_VOLATILITY_EXT'
  | 'STRAT_SENTINEL'

export type IntentAction = 'BUY' | 'SELL' | 'HOLD' | 'STAKE' | 'UNSTAKE' | 'COMPOUND' | 'FLATTEN'

export type Intent = {
  id: string
  strategy: StrategyId
  action: IntentAction
  assetId: string
  amount: number
  priceHint: number
  confidence: number
  /** Always true in this module until LIA_LIVE gates */
  paper: true
  reason: string
  at: number
}

export type AuraBridgeMode = 'bull' | 'bear' | 'reward' | 'stable' | 'risk'

export const STRATEGY_AURA: Record<StrategyId, AuraBridgeMode> = {
  STRAT_TREND_FOLLOW: 'bull',
  STRAT_MEAN_REVERSION: 'bear',
  STRAT_DELTA_NEUTRAL: 'stable',
  STRAT_YIELD_OPTIMIZER: 'reward',
  STRAT_COMPOUND_MAX: 'reward',
  STRAT_ARB_MARKET: 'stable',
  STRAT_CORRELATION_ARB: 'bull',
  STRAT_LIQUIDITY_SNIPER: 'bull',
  STRAT_SENTIMENT_DIV: 'bull',
  STRAT_VOLATILITY_EXT: 'stable',
  STRAT_SENTINEL: 'risk',
}

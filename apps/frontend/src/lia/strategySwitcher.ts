/**
 * Strategy Switcher — pure function, no side effects, no TX.
 */
import type { Matrix10, StrategyId } from './types'

const VOL_HIGH = 0.55
const VOL_LOW = 0.22
const CONF_MIN = 0.7
const DIST_EXTREME = 0.65

/**
 * SELECT step of the decision cycle (MSM §4 / Integration Spec §1).
 */
export function selectStrategy(m: Matrix10): { strategy: StrategyId; reason: string } {
  // Guardian: locked / burned → sentinel
  if (m.assetState === 'Locked' || m.assetState === 'Burned') {
    return { strategy: 'STRAT_SENTINEL', reason: 'asset_state_blocked' }
  }

  // Sentiment divergence (alpha)
  if (m.trend === 'SIDEWAYS' && m.sentiment >= 0.75 && m.confidence >= 0.55) {
    return { strategy: 'STRAT_SENTIMENT_DIV', reason: 'sentiment_price_gap' }
  }

  // Extreme distance → mean reversion
  if (m.distance >= DIST_EXTREME && m.volatility < VOL_HIGH) {
    return { strategy: 'STRAT_MEAN_REVERSION', reason: 'distance_extreme' }
  }

  // Trend + high vol
  if (m.trend === 'UP' && m.volatility >= VOL_HIGH && m.confidence >= CONF_MIN) {
    return { strategy: 'STRAT_TREND_FOLLOW', reason: 'trend_up_vol_high' }
  }

  // Down + high vol → hedge
  if (m.trend === 'DOWN' && m.volatility >= VOL_HIGH) {
    return { strategy: 'STRAT_DELTA_NEUTRAL', reason: 'trend_down_vol_high' }
  }

  // Up + low vol → compound / yield
  if (m.trend === 'UP' && m.volatility <= VOL_LOW && m.assetState === 'Liquid') {
    return { strategy: 'STRAT_COMPOUND_MAX', reason: 'trend_up_vol_low' }
  }

  // Sideways + liquid → yield or arb
  if (m.trend === 'SIDEWAYS') {
    if (m.liquidity > 0 && m.volatility < VOL_LOW) {
      return { strategy: 'STRAT_VOLATILITY_EXT', reason: 'sideways_low_vol' }
    }
    if (m.assetState === 'Liquid') {
      return { strategy: 'STRAT_YIELD_OPTIMIZER', reason: 'sideways_liquid' }
    }
    return { strategy: 'STRAT_ARB_MARKET', reason: 'sideways_arb' }
  }

  // Staked capital → compound path
  if (m.assetState === 'Staked') {
    return { strategy: 'STRAT_COMPOUND_MAX', reason: 'already_staked' }
  }

  return { strategy: 'STRAT_YIELD_OPTIMIZER', reason: 'default_foundation' }
}

export function intentActionFor(
  strategy: StrategyId,
  m: Matrix10,
): import('./types').IntentAction {
  switch (strategy) {
    case 'STRAT_TREND_FOLLOW':
    case 'STRAT_SENTIMENT_DIV':
    case 'STRAT_CORRELATION_ARB':
      return m.trend === 'DOWN' ? 'SELL' : 'BUY'
    case 'STRAT_MEAN_REVERSION':
      return m.distance > 0 ? 'SELL' : 'BUY'
    case 'STRAT_YIELD_OPTIMIZER':
      return 'STAKE'
    case 'STRAT_COMPOUND_MAX':
      return 'COMPOUND'
    case 'STRAT_DELTA_NEUTRAL':
      return 'HOLD'
    case 'STRAT_SENTINEL':
      return 'FLATTEN'
    case 'STRAT_ARB_MARKET':
    case 'STRAT_LIQUIDITY_SNIPER':
    case 'STRAT_VOLATILITY_EXT':
    default:
      return 'HOLD'
  }
}

# Strategies catalog

Source: `lia/brain/strategies.py`

| ID | Family | Description |
|----|--------|-------------|
| STRAT_TREND_FOLLOW | trend | Directional + vol filter |
| STRAT_MOMENTUM_BREAKOUT | trend | Break + confirmation |
| STRAT_MEAN_REVERSION | mean | Fade distance extremes |
| STRAT_SENTIMENT_DIV | mean | Sideways + strong sentiment |
| STRAT_DELTA_NEUTRAL | hedge | Down + high vol flatten |
| STRAT_SENTINEL | hedge | Locked/burned |
| STRAT_COMPOUND_MAX | yield | Up + low vol compound |
| STRAT_YIELD_OPTIMIZER | yield | Sideways liquid default |
| STRAT_VOLATILITY_EXT | yield | Sideways low-vol |
| STRAT_ARB_MARKET | meta | Sideways arb |
| STRAT_CORRELATION_ARB | meta | Pair divergence |
| STRAT_LIQUIDITY_SNIPER | meta | Thin book |
| STRAT_MICRO_PROOF | meta | Ops dust |
| STRAT_ART_MOMENTUM | meta | RWA aesthetic momentum (paper) |

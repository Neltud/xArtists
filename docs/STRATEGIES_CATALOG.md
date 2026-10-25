---
hidden: true
noIndex: true
---

# Strategies catalog

Source: `lia/brain/strategies.py`

| ID                        | Family | Description                    |
| ------------------------- | ------ | ------------------------------ |
| STRAT\_TREND\_FOLLOW      | trend  | Directional + vol filter       |
| STRAT\_MOMENTUM\_BREAKOUT | trend  | Break + confirmation           |
| STRAT\_MEAN\_REVERSION    | mean   | Fade distance extremes         |
| STRAT\_SENTIMENT\_DIV     | mean   | Sideways + strong sentiment    |
| STRAT\_DELTA\_NEUTRAL     | hedge  | Down + high vol flatten        |
| STRAT\_SENTINEL           | hedge  | Locked/burned                  |
| STRAT\_COMPOUND\_MAX      | yield  | Up + low vol compound          |
| STRAT\_YIELD\_OPTIMIZER   | yield  | Sideways liquid default        |
| STRAT\_VOLATILITY\_EXT    | yield  | Sideways low-vol               |
| STRAT\_ARB\_MARKET        | meta   | Sideways arb                   |
| STRAT\_CORRELATION\_ARB   | meta   | Pair divergence                |
| STRAT\_LIQUIDITY\_SNIPER  | meta   | Thin book                      |
| STRAT\_MICRO\_PROOF       | meta   | Ops dust                       |
| STRAT\_ART\_MOMENTUM      | meta   | RWA aesthetic momentum (paper) |

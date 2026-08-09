# Million Path — $start → $1,000,000 USDC

## Honesty first

| Claim | Reality |
|-------|---------|
| “Fast AND sure” | **Contradiction** at extreme multiples |
| Pure +1% nets only | **1279** sequential wins for $3 → $1M |
| 55% winrate, ±1% | ~**13 400** steps ≈ **7+ years** at 5 trades/day |
| 90% winrate, ±1% | ~**1 600** steps ≈ **0.9 year** at 5/day |
| 50% winrate, ±1% | **Infeasible** (edge ≤ 0 if loss = win size) |

LIA optimizes **survivable speed**: Guardian + adaptive lock > raw growth rate.

## Engine

`lia/circuit/million_path.py`

### Phases

| Phase | Equity (from $3 → $1M) | Lock ratio | Risk/trade | TP |
|-------|------------------------|------------|------------|-----|
| BOOTSTRAP | &lt; 2× start | 50% | 0.5% | fixed |
| ACCUMULATE | &lt; 1% of goal | 60% | 0.8% | log partials |
| COMPOUND | &lt; 25% goal | **70%** | 1% | ladder + trail |
| HARVEST | → goal | 85% | 0.5% | exp, tight trail |
| PRESERVE | ≥ goal | 95% | 0.2% | protect / yield |

### On each win

```
settle_win(net_pnl, equity) → locked + compoundable
ledger only spends compoundable_usd for next risk
```

### Trailing + partials

`on_tick_tp(position, price, phase_policy)` → PARTIAL | TRAIL_EXIT

## Publish for UI

```bash
LIA_EQUITY_USD=3 python -m lia.board.publish_path
# → data/lia_million_path.json
```

## Required for “real” path

1. Positive expectancy after fees (PreFlight + gas gates)
2. `LIA_LIVE_TRADING=0` until micro-proof
3. Deploy market SC for fee income (treasury, not only trading PnL)
4. Never raise leverage to “catch up” to $1M — spiral kill-switch

**Starting capital matters more than fantasy winrate.**  
$3 is a narrative seed; operational path needs realistic equity + edge.

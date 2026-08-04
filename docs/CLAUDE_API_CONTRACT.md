# Contrat API exact — Claude ↔ LIA

## social_intel (`lia/signals/social_intel.py`)

```python
from lia.signals.social_intel import SocialIntel, SocialBias, analyze_items

bias: SocialBias = SocialIntel().run(persist=False)
d: dict = bias.to_dict()
# keys: bias, confidence, weight, rumor_flag, n, items, updated, source
# confidence in [0, 1]  — NOT 0-100
# weight already capped <= 0.15
```

`data/social_watchlist.json` → `"weight_cap": 0.15`

## SignalBus (`lia/claude_agent/signal_bus.py`)

```python
from lia.claude_agent.signal_bus import SignalBus, BusSignal

bus = SignalBus()  # default caps include social_intel=0.15
bus.add_social_from_bias(d)  # SocialBias.to_dict()
out = bus.composite()  # no args
# out: bias, confidence [0,1], weight, n, caps, sources
```

## compound_pyramids (`lia/circuit/compound_pyramids.py`)

```python
from lia.circuit.compound_pyramids import (
    DEFAULT_PYRAMID,  # list[SleeveSpec]
    SleeveSpec,
    SleeveState,
    CompoundPyramids,
)

# SleeveSpec fields: id, weight, target_net_pct, max_trades_per_day,
#   max_trades_per_week, min_hours_between, compounds_goal, kind

# Fixed target weights (source of truth):
# MOM 0.15 | MR 0.15 | MICRO_ARB 0.20 | WEEKLY_SWING 0.10 | YIELD 0.25 | RESERVE 0.15

p = CompoundPyramids(total_book_usd=100.0)
p.can_trade("MICRO_ARB")           # -> {ok, reason?, equity_usd, ...}
p.precheck_edge("MICRO_ARB", gross_edge_pct=0.015, notional_usd=15, protocol="ashswap")
p.record_outcome("MOM", net_pct=0.01, notional_usd=10, win=True)
p.progress()                       # compounds_done / goal
p.rebalance_weights(100.0)         # reset equities to target weights
p.save()
```

**No separate `compute_weights()` function** — weights live on `DEFAULT_PYRAMID[i].weight`.

## pyramids_external_allocator (`lia/claude_agent/pyramids_adapter.py`)

```python
from lia.claude_agent.pyramids_adapter import pyramids_external_allocator, sleeves_to_weights
from lia.claude_agent.portfolio_allocator import get_allocation

sleeves_to_weights()
# {'MOM': 0.15, 'MR': 0.15, 'MICRO_ARB': 0.20,
#  'WEEKLY_SWING': 0.10, 'YIELD': 0.25, 'RESERVE': 0.15}

result = get_allocation(
    performances,           # list[StrategyPerformance] — may be ignored for weights
    total_budget=100.0,
    external_allocator=pyramids_external_allocator,
)
# result.weights == sleeves_to_weights() (normalized)
# use_live_state=True only if you want equity-proportional drift from saved state
```

Fallback winrate allocation **must not** run when `lia.circuit.compound_pyramids` imports successfully.

## Confidence scale

All LIA confidences are **0.0–1.0**. If Claude UI shows 68, treat as 0.68 before `add_social_from_bias`.

# Guardian FAST PATH — Task 1 (War Room)

**Module:** `lia/guardian/` · **Before Brain** · **Budget: < 10 ms**

## Kill-switch state machine

```
ARMED --trip(soft)--> TRIPPED --trip(hard)--> KILLED
  ^                     |                      |
  +----- ops reset -----+----------------------+
```

## Math

- VaR = |N| * σ * z * L (z=1.65)
- Kelly f* = (p(b+1)-1)/b ; f = κ f* (κ=0.25)
- Spiral S = max(0,r_roe)*I*L + 2*max(0,-DD)*L
- Death spiral if S≥0.35 OR (L>1 AND wins≥3 AND I≥0.5) OR auto_compound_loop

## Defaults

max_dd=12%, loss_streak=5, var_limit=2% equity, max_live_lev=1.5, max_pct=20%

## Integration

```python
from lia.guardian import PreFlightValidator, ProposedOrder, PortfolioSnapshot
g = PreFlightValidator()
r = g.validate(order, book)
if not r.allow: return  # halt executor
```

Tests: 20 passed (latency << 5 ms).

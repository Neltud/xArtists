---
hidden: true
noIndex: true
---

# Guardian FAST PATH — Task 1 (War Room)

**Module:** `lia/guardian/` · **Before Brain** · **Budget: < 10 ms**

## Kill-switch state machine

```
ARMED --trip(soft)--> TRIPPED --trip(hard)--> KILLED
  ^                     |                      |
  +----- ops reset -----+----------------------+
```

## Math

* VaR = |N| \* σ \* z \* L (z=1.65)
* Kelly f\* = (p(b+1)-1)/b ; f = κ f\* (κ=0.25)
* Spiral S = max(0,r\_roe)_&#x49;_&#x4C; + 2\*max(0,-DD)\*L
* Death spiral if S≥0.35 OR (L>1 AND wins≥3 AND I≥0.5) OR auto\_compound\_loop

## Defaults

max\_dd=12%, loss\_streak=5, var\_limit=2% equity, max\_live\_lev=1.5, max\_pct=20%

## Integration

```python
from lia.guardian import PreFlightValidator, ProposedOrder, PortfolioSnapshot
g = PreFlightValidator()
r = g.validate(order, book)
if not r.allow: return  # halt executor
```

Tests: 20 passed (latency << 5 ms).

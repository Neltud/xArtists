# Phase 7 — Performance-driven economy

**No points. No claim ticks.** Equity + realized/attributed performance only.

| Module | Role |
|--------|------|
| `performance_tracker.py` | Pack equity, trading PnL share, RWA appreciation |
| `yield_distributor.py` | Cycle credit to managed balance (no mint) |
| `economic_compliance.py` | User profit ≤ protocol + RWA (anti-ghost) |
| `PortfolioWealth.tsx` | UI without points language |

```bash
PYTHONPATH=. python -m lia.brain.performance_tracker
PYTHONPATH=. python -m lia.guardian.yield_distributor --cycle
PYTHONPATH=. python -m lia.utils.economic_compliance
```

Honest: values are **shadow/attribution** until on-chain sub-accounts exist.

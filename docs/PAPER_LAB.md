# Paper Lab — autonomous swarm stress test

```bash
export LIA_LIVE_TRADING=0
# Requires: lia/agents/autonomous_swarm.py + million_path + preflight on disk
PYTHONPATH=. python -m lia.agents.paper_lab --cycles 100 --equity 100
# → data/lia_paper_lab.json
```

## Example (seed=42, 100 cycles, honest ~55–65% edge model)

| Metric | Value |
|--------|-------|
| Return | ~+2.8% |
| Winrate | ~65% |
| Max DD | ~0.5% |
| Lead agents | MOMENTUM, MEAN_REV |
| Lock ledger | 60% lock mid-path ACCUMULATE |

**Not a live forecast.** Stresses routing, PreFlight, phase locks.

## Pipeline

v1.3.1: step `swarm` after `mvx_agent` (paper).

## Copy critical modules (once)

```bash
cp artifacts/autonomous_swarm.py lia/agents/
cp artifacts/million_path.py lia/circuit/
cp artifacts/preflight.py lia/guardian/
cp artifacts/compound_engine_FIXED.py lia/circuit/compound_engine.py
git add -A && git commit -m "feat: critical LIA modules" && git push
```

# Phase 5 — RWA Intelligence Engine

**Paper / HITL.** Valuations are AI proxies, not formal appraisals. Mint does not auto-broadcast.

## Modules

| Module | Role |
|--------|------|
| `lia/brain/sentiment_analyzer.py` | Market sentiment proxy |
| `lia/brain/rwa_evaluator.py` | Score 0–100 + price proxy + reassess |
| `lia/guardian/rwa_minter.py` | Mint proposal + cert hash metadata |
| `lia/guardian/fulfillment.py` | Sell → shipment sim + audit |
| `STRAT_ART_MOMENTUM` | Rising aesthetic momentum (paper) |

## Commands

```bash
PYTHONPATH=. python -m lia.brain.rwa_evaluator --reassess
PYTHONPATH=. python -m lia.guardian.rwa_minter --work rwa_001
PYTHONPATH=. python -m lia.guardian.fulfillment --sell rwa_001 --buyer erd1...
```

## UI

`/#/rwa` — catalog, valuation bars, shipment status.

## Safety

`LIA_LIVE_TRADING=0` default. Physical logistics simulated until 3PL wired.

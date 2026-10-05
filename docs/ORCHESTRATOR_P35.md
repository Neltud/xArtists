# Phase 3.5 — Orchestrator & validation

## Hysteresis (`lia/brain/orchestrator.py`)

- Raw `select_strategy` each tick
- Switch only after **N consecutive** same raw picks (default N=3)
- Weights from last ~24h shadow PnL can shorten hysteresis by 1 if pending >> active
- State: `data/strategy_orchestrator.json` (+ public mirror)

## Precision (`lia/utils/precision.py`)

```python
normalize_for_token(0.0001, "TRO-94c925")  # → 100 (6 decimals)
normalize_for_token(0.001, "EGLD")         # → 1e15 (18 decimals)
```

## Backtest (`lia/brain/backtest.py`)

```bash
PYTHONPATH=. python -m lia.brain.backtest --days 7
```

Writes `data/strategy_backtest_report.json` (win rate, max DD, profit factor per strategy).

## Safety

`LIA_LIVE_TRADING=0` — orchestration is paper-side.

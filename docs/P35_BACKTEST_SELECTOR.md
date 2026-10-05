# Backtest sample (synthetic 7d × 24 bars)

```bash
PYTHONPATH=. python -m lia.brain.backtest --days 7
```

Selector path (illustrative, not live):

| Metric | Value |
|--------|-------|
| Bars | 168 |
| Win rate | ~60.7% |
| PnL USD | ~+5.7 |
| Max DD | ~0.39 |
| Profit factor | ~2.9 |

Per-strategy breakdown in `data/strategy_backtest_report.json` after local run.

**Not financial performance.** Paper only.

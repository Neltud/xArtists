# Hardened execution (post-dust)

## Fixes vs first autonomous run

| Issue | Mitigation |
|-------|------------|
| Slippage exceeded | Dynamic bps 0.5–2% + widen +100 bps / retry |
| Silent fail | Lifecycle await: CONFIRMED / FAILED_SLIPPAGE / FAILED_GAS |
| Spam | ≤8 TX/h, ≤24/day, ≥45s spacing |
| Drawdown | 12% session equity → halt + disable autonomous |

## Run

```bash
export LIA_PEM_PATH=/path/to/pem   # hors git
export LIA_LIVE_TRADING=1
export LIA_AUTONOMOUS_DUST=1
PYTHONPATH=. python -m lia.guardian.execution_engine --run
```

Telemetry: `data/execution_feed.jsonl` + UI `ExecutionFeed`.

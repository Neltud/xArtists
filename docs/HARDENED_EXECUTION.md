# Hardened execution (Phase 10)

## Lifecycle
`INTENT → BROADCAST → CONFIRMED | FAILED_SLIPPAGE | FAILED_GAS | RETRYING → EXECUTION_ERROR`

## Dynamic slippage
`dynamic_slippage_bps()` from `performance_delta` + time-of-day, **50–500 bps**, widens each retry.

## Retries
Max **3** attempts; then `EXECUTION_ERROR` in feed/audit.

## Fortress
| Control | Limit |
|---------|--------|
| Max trade | 0.01 EGLD / $15 |
| Velocity | 8/h, 24/day, 45s cooldown |
| Daily loss | $25 → halt + `LIA_AUTONOMOUS_DUST=0` |
| Drawdown | 12% peak equity → halt |
| NFT | ABORT |

## Telemetry
`data/execution_telemetry.json` polled by `LiveExecutionFeed` (no WS required on Pages).

## Scaling tiers
1. **Dust** — max 0.01 EGLD (current)
2. **Standard** — max 10% wallet (config change + ops)
3. **Institutional** — every trade HITL approval

```bash
LIA_LIVE_TRADING=1 LIA_AUTONOMOUS_DUST=1 LIA_PEM_PATH=... \\
  PYTHONPATH=. python -m lia.guardian.execution_engine --run --full
```

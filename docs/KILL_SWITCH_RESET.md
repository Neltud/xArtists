# Kill-Switch reset circuit

**Module:** `lia/guardian/kill_reset.py`

Never auto-reset. Ops-only. Audit log. Live double-gate.

## Flow

```
ARMED --trip--> TRIPPED|KILLED --request_reset--> PENDING --confirm_reset--> ARMED
```

| Kind | Cooldown | Steps |
|------|----------|-------|
| Soft (LOSS_STREAK, LEVERAGE) | 60s | confirm alone OK |
| Hard (DRAWDOWN, EQUITY_FLOOR, DEATH_SPIRAL) | 300s | request + confirm + post_mortem_ref |

Live: `KILL_RESET_ACK=1` required. Optional `KILL_RESET_TOKEN`.

```python
v.request_kill_reset("ops1", note="reviewed")
v.confirm_kill_reset("ops1", post_mortem_ref="docs/pm.md")
```

Log: `data/guardian_kill_log.json`

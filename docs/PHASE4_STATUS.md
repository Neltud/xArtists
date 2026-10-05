# Phase 4 status — Beta Strike Protocol

**As of 2026-10-05 — DEPLOYMENT READY (HITL), not autonomous.**

| Workstream | Status |
|------------|--------|
| HITL strike_deployer | ✅ `--propose` / `--execute-proposal` / `--mark-executed` |
| First Blood 1–3 | ✅ on-chain (ESDT, wrap, swap) |
| First Blood 4–5 | ⏳ `pending_human` in `data/strike_proposals.json` |
| post_trade → performance_delta | ✅ |
| Orchestrator × real weights | ✅ |
| Black Swan kill-switch | ✅ 8% / 15 min |
| On-chain monitor + Live UI | ✅ display only |
| `LIA_LIVE_TRADING` | **0** (default) |

## Preflight (last check)

- kill_switch: unlocked
- flash: not triggered
- deployer EGLD ≈ 0.238
- API: OK

## Next human step (slot 4)

```bash
LIA_LIVE_TRADING=1 PYTHONPATH=. python -m lia.guardian.strike_deployer --execute-proposal prop_3c80ce1c74
# then dust wrap+swap or transfer via executor
# then --mark-executed prop_3c80ce1c74 <txHash>
```

No automation without human oversight.

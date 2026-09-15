# P1.1 — nodes UniversalExecutor + resolve_mode

**2026-09-15**

`nodes/universal_executor.py` now:

1. Calls `lia.executor.mode.resolve_mode(force_mode)` at `run()` entry
2. **`auto` / `live` without `LIA_LIVE_TRADING=1` + PEM → paper** (simulated actions only)
3. `_submit_transaction` hard-refuses if live gates not met

Fallback inline `resolve_mode` if `lia` package not on path (same rules).

```bash
export LIA_LIVE_TRADING=0
# force_mode=auto → paper
```

See `lia/executor/mode.py` and `docs/LIA_EXECUTOR_WORKSTREAM.md`.

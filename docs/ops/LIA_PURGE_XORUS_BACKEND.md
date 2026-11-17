# LIA purge → xOrus backend

**Phase 0 + Phase 1 delivered (2026-11-17).**

## Status

| Phase | Status |
|-------|--------|
| 0 Skeleton `xorus/` | Done |
| 1 Port analysis modules under `xorus/` (no `lia.*` imports on hot path) | **Done** |
| 2 Front: LIA widgets off XorusPage; live flags forced false | In progress |
| 3 Archive `lia/vellum` | Pending |
| 4 `archive/lia-retired` | Pending |

## Canonical commands

```bash
PYTHONPATH=. python -m xorus
PYTHONPATH=. python -m xorus.production_run
```

## Safety

See `xorus/safety.py`. `executable=false` always. `LIA_LIVE_TRADING=1` raises in production_run.

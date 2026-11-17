# LIA purge → xOrus backend

**2026-11-17 — Phases 0–3 + 1b full inline delivered.**

## Status

| Phase | Status |
|-------|--------|
| 0 Skeleton `xorus/` | **Done** |
| 1 Canonical `xorus.*` API | **Done** |
| 1b `xorus.paper_engine` inlined (zlib, zero `lia` import) | **Done** |
| 1b analysis_* / data_feed / preprod / decision full inline | **Done** |
| 2 Front XorusPage without LIA UI | **Done** |
| 3 `lia.vellum` → ImportError | **Done** |
| 4 Physical archive of `lia/` | Pending |

## Commands

```bash
PYTHONPATH=. python -m xorus
PYTHONPATH=. python -m xorus.production_run
```

## Safety

- `xorus/safety.py`: executable=false, sentinel_veto=true
- `import lia.vellum` raises
- `LIA_LIVE_TRADING=1` raises in production_run
- Hot path has **zero** `lia.*` imports (zlib-inlined modules)

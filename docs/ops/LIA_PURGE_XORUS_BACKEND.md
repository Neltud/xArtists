# LIA purge → xOrus backend

**2026-11-17 — Phases 0, 1, 1b (inline), 2, 3 delivered.**

## Status

| Phase | Status |
|-------|--------|
| 0 Skeleton `xorus/` | **Done** |
| 1 Canonical `xorus.*` API | **Done** |
| 1b Inline paper_engine + analysis (no lia imports on hot path) | **Done** |
| 2 Front XorusPage without LIA UI; flags forced false | **Done** |
| 3 `lia.vellum` raises ImportError; archive notice | **Done** |
| 4 Physical `git mv lia → archive/lia-retired` | Pending |

## Commands

```bash
PYTHONPATH=. python -m xorus
PYTHONPATH=. python -m xorus.production_run
```

## Safety

`xorus/safety.py`: executable=false, sentinel_veto=true, ChatGPT ≤15%.
`LIA_LIVE_TRADING=1` raises in production_run.
`import lia.vellum` raises ImportError.

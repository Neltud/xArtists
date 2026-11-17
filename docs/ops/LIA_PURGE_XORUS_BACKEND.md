# LIA purge → xOrus backend

**2026-11-17 — Phase 0 + Phase 1 (API surface) + Phase 2 (front) delivered.**

## Status

| Phase | Status |
|-------|--------|
| 0 Skeleton `xorus/` | **Done** |
| 1 Canonical `xorus.*` imports (catalog, swarm, paper_engine bridge, analysis*) | **Done** (engine still bridges Chorus paper scorer) |
| 2 Front: LIA widgets off XorusPage; `LIA_LIVE_TRADING` forced false | **Done** |
| 1b Inline full scorer (zero `lia.chorus` import) | Next |
| 3 Archive `lia/vellum` | Pending |
| 4 `archive/lia-retired` | Pending |

## Commands

```bash
PYTHONPATH=. python -m xorus
PYTHONPATH=. python -m xorus.production_run
```

## Front

- `apps/frontend/src/config/xorusConfig.ts` — paper only
- `liaConfig.ts` — retired, flags always false
- `XorusPage.tsx` — decision desk + dual signals; LIA hub/terminal unmounted

## Safety

`xorus/safety.py`: `executable=false`, `sentinel_veto=true`, ChatGPT ≤15%.
`LIA_LIVE_TRADING=1` raises in `production_run`.

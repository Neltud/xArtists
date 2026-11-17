# LIA purge → xOrus backend (isomorphic, paper only)

**Date:** 2026-11-17  
**Owner:** Grok chef d'orchestre  
**Status:** Phase 0 delivered (package `xorus/` on main). Full tree move of `lia/xorus` + archive of `lia/vellum` = next phases.

## Decision

LIA is **retired**. Intelligence and paper decisioning run under **xOrus** only.

- Same *role* as the old LIA paper brain (catalog, cycle, board, publish to `public/data`).
- **Not** the same capabilities as LIA live trading / Vellum PEM path.
- Sentinel veto absolute; dual external briefs (Grok + ChatGPT ≤15 %); `executable=false`.

## Target layout

```
xorus/                    # NEW canonical package
  __init__.py
  __main__.py
  safety.py               # immutable contract
  swarm.py                # board runner
  production_run.py       # replaces lia.vellum.production_run
  README.md
services/signals-worker/  # daily dual reports (already paper)
lia/                      # RETIRE → archive/lia-retired/ after consumer cutover
lia/xorus/                # thin shim → re-export xorus until imports updated
```

## Phases

| Phase | Action | GO criteria |
|-------|--------|-------------|
| **0** | Top-level `xorus/` + this doc + safety seal | Package importable; `LIA_LIVE_TRADING=1` raises |
| **1** | Move `lia/xorus/*` analysis modules under `xorus/` (rewrite imports off `lia.chorus` where possible) | `python -m xorus.production_run` green offline |
| **2** | Front: remove LIA widgets / `VITE_LIA_*` live paths; XorusPage uses xOrus data only | Build + e2e xorus |
| **3** | Archive `lia/vellum`, `README_LIA.md`, stop documenting LIA ops | No CI job calls `lia.vellum` |
| **4** | Optional: `git mv lia archive/lia-retired` after zero imports | Search `lia.vellum` / `LIA_LIVE_TRADING=1` = 0 in active paths |

## Non-goals (this program)

- No activation of mint, PayBox checkout, Stripe, MoonPay, auction, Studio upload.
- No OVH VPS SSH redeploy (see commit `a32870bc` — no VPS present).
- No DNS change.

## Operator switch

```bash
# BEFORE (retired)
PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.vellum.production_run

# AFTER
PYTHONPATH=. python -m xorus.production_run
```

## Safety regression tests (to add in phase 1)

- Import `xorus.safety.SAFETY` → all authorization flags false.
- `LIA_LIVE_TRADING=1` + `xorus.production_run` → RuntimeError.
- Board seal always sets `executable=false`.

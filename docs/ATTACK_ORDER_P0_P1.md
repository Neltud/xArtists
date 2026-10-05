# Attack order progress (2026-10-05)

## P0 — DONE (code)

| Action | Status |
|--------|--------|
| Cron Shadow Sprint | `.github/workflows/shadow-sprint.yml` every 2h + manual |
| `lia/calldata/` | ESDT + wrap + swapTokensFixedInput + `dust_egld_to_usdc_plan` |
| Docs | `docs/CALLDATA_P0.md`, `docs/SHADOW_CRON_P0.md` |

**Ops:** run workflow once via Actions → `workflow_dispatch` to unfreeze KPIs on main.

**Calldata:** plan is structural; first LIVE dust needs explorer-verified router + non-zero `min_out` quote.

## P1 — IN PROGRESS

| Action | Status |
|--------|--------|
| Server intent JSON | `lia/intent/server_intent.py` → `data/lia_intent_feed.json` |
| ESDT dust TX prouvée | Script ready; needs token balance + `--send` |

## Still open

- Wire sprint tick → `write_intent_snapshot` automatically
- Quote client for min_out
- ESDT micro-proof TX hash in docs
- P2 monorepo purge / UX holder

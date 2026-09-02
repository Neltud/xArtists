# E2E Test Report — 2026-08-09

## Live site (neltud.github.io/xArtists)

| Check | Result |
|-------|--------|
| GET `/xArtists/` | 200 — SPA shell OK |
| GET deep routes (`/trading` etc.) | 404 HTTP (SPA) — **404.html** added to `public/` for next rebuild |
| `data/contracts.json` | 200 |
| `data/lia_v6_status.json` | 200 |
| `data/greensmoke_forecasts.json` | 200 |
| `data/lia_trades.json` | 200 |
| `data/desk_last.json` | 200 (stub published) |
| `data/vellum_last_run.json` | 200 (stub published) |

### SC readiness (contracts.json)

- marketplace address present but **codeHash null / empty account** → NOT live
- agents_marketplace: **null**
- rwa_escrow_bridge: **null**
- Do not send user funds until codeHash ≠ null

## Python regression (fresh clone + fixes)

| Suite | Result |
|-------|--------|
| Before compound restore | 72 PASS / 4 FAIL (placeholder compound_engine) |
| After local restore | **76 PASS / 0 FAIL** |

Failures fixed locally:
1. `compound_engine.py` placeholder → real CompoundCircuit
2. `test_symbiosis` old_docs_problem → new_default_ok

## Critical remaining on main

**`lia/circuit/compound_engine.py` is still `# placeholder` on GitHub.**

```bash
# From repo root — uses scripts/apply_compound_fix.py once the real script is on main
python scripts/apply_compound_fix.py
PYTHONPATH=. LIA_LIVE_TRADING=0 python3 tests/regression/run_all.py
```

Or replace `lia/circuit/compound_engine.py` with the fixed artifact from the audit session.

## SPA deep links

After Pages rebuild with `public/404.html` (= index shell), routes like `/xArtists/trading` should load the SPA.

## P0 product gates

1. Deploy agents-marketplace + nft-marketplace (codeHash)
2. Rebuild Pages
3. Micro List/Buy with user wallet
4. Keep LIA_LIVE_TRADING=0

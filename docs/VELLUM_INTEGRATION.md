# Vellum ↔ xArtists — integration contract

**Last updated:** 2026-10-04  
**Audience:** Vellum workflow nodes + human ops  
**Rule:** `LIA_LIVE_TRADING=0` by default. No PEM in git. No auto-sign.

## 1. What Vellum is allowed to do

| Action | Allowed |
|--------|--------|
| `git clone` / pull `main` | Yes |
| `python -m lia.vellum.next_run` | Yes (paper) |
| `python -m lia.vellum.production_run` | Yes (paper + gates) |
| `python -m lia.vellum.publish_data_for_frontend` | Yes |
| `python -m scripts.vellum_healthcheck` | Yes |
| Set `LIA_LIVE_TRADING=1` | **No** without human + micro-proofs |
| Commit secrets / PEM | **Never** |
| Deploy SC / fund wallets | **Never** from Vellum alone |

## 2. Repo access (body)

```text
https://github.com/Neltud/xArtists.git
branch: main
```

Recommended Vellum workspace layout:

```bash
git clone --depth 1 https://github.com/Neltud/xArtists.git
cd xArtists
export PYTHONPATH=.
export CHAIN=1
export LIA_LIVE_TRADING=0
python -m scripts.vellum_healthcheck
python -m lia.vellum.next_run
```

Private deps / PEM / Pinata JWT live only in **Vellum secrets**, never in the repo.

## 3. Canonical entrypoints

| Command | Role |
|---------|------|
| `python -m lia.vellum.next_run` | One paper cycle (delegates to `pipeline`) |
| `python -m lia.vellum.pipeline` | Same, importable |
| `python -m lia.vellum.production_run` | Cycle + security gates + optional brain/paper legs |
| `python -m lia.vellum.publish_data_for_frontend` | Mirror `data/*.json` → `apps/frontend/public/data` + `docs/data` |

Machine-readable map: [`data/vellum_pipeline_map.json`](../data/vellum_pipeline_map.json)  
Repo contract: [`data/vellum_repo_contract.json`](../data/vellum_repo_contract.json)

## 4. Publish path (front can read)

Pipeline / publish writes JSON under:

1. `data/`
2. `docs/data/`
3. `apps/frontend/public/data/`

Front (GitHub Pages) can fetch:

```text
https://neltud.github.io/xArtists/data/<file>.json
```

Critical names (see `publish_data_for_frontend.CRITICAL`): status, signals, board, gates, paper legs, etc.

## 5. Frontend LIA (browser shadow — complementary)

Not a substitute for Python pipeline. Browser-only decision cycle:

| Path | Role |
|------|------|
| `apps/frontend/src/lia/` | Matrix, switcher, shadow ledger, STVP |
| Command Center → **LIA Shadow** | UI war room |

Vellum does **not** need to execute the browser module. Optional later: publish `lia_last_run.json` that the CC can display.

## 6. Environment (Vellum secrets)

```bash
PYTHONPATH=.
CHAIN=1
LIA_LIVE_TRADING=0          # mandatory default
# Optional reads:
# MULTIVERSX_API=https://api.multiversx.com
# VITE_* never required for Python pipeline
```

Do **not** inject `LIA_LIVE_TRADING=1` into Vellum env until:

1. STVP / micro-proofs documented  
2. Human approver  
3. Guardian cannot self-resume  

## 7. Soft-failure policy

`lia.vellum.pipeline` is designed so **missing optional modules do not abort** the whole cycle (except `chain != 1`).  
Run `python -m scripts.vellum_healthcheck` after pull to see which imports are present vs phantom.

## 8. Claude / Grok advisors

Contract for signal shapes: [`docs/CLAUDE_API_CONTRACT.md`](CLAUDE_API_CONTRACT.md).  
Advisors **never sign**. Only produce structured bias / comments consumed by Guardian → Brain → paper executor.

## 9. Forbidden

- Writing `VITE_*_CODEHASH_OK=1` into the repo  
- Shipping PEM / mnemonic / Pinata secret in artifacts  
- Calling SC deploy from a Vellum node without a separate human-gated runbook  
- Treating paper fills as on-chain ownership  

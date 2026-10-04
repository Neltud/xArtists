# LIA — agent body (repo) + Vellum brain

**Updated:** 2026-10-04  
**Default:** `LIA_LIVE_TRADING=0` · mainnet only · paper until micro-proofs

## Architecture

```text
Vellum (orchestrator / secrets)
    │  git pull main · PYTHONPATH=.
    ▼
lia.vellum.next_run / production_run   ← paper cycle
    │
    ▼
data/*.json  ──mirror──►  apps/frontend/public/data/
    │
    ▼
GitHub Pages  https://neltud.github.io/xArtists/
```

Browser shadow (no TX): Command Center → **LIA Shadow** · `apps/frontend/src/lia/`

## Vellum access (do this first)

Full contract: **[docs/VELLUM_INTEGRATION.md](docs/VELLUM_INTEGRATION.md)**

```bash
git clone --depth 1 https://github.com/Neltud/xArtists.git && cd xArtists
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m scripts.vellum_healthcheck
python -m lia.vellum.next_run
python -m lia.vellum.publish_data_for_frontend
```

Machine maps:

- [`data/vellum_repo_contract.json`](data/vellum_repo_contract.json)
- [`data/vellum_pipeline_map.json`](data/vellum_pipeline_map.json)

## Entry points

| Command | Role |
|---------|------|
| `python -m scripts.vellum_healthcheck` | Soft-import report |
| `python -m lia.vellum.next_run` | One paper pipeline cycle |
| `python -m lia.vellum.production_run` | Cycle + gates |
| `python -m lia.vellum.publish_data_for_frontend` | Mirror JSON to Pages path |

## Non-goals

- PEM / mnemonic in git  
- Auto-enable `LIA_LIVE_TRADING=1`  
- Treat paper fills as on-chain ownership  

Advisor contracts: [docs/CLAUDE_API_CONTRACT.md](docs/CLAUDE_API_CONTRACT.md)  
Shadow STVP: [docs/LIA_SHADOW_AND_STRATEGY.md](docs/LIA_SHADOW_AND_STRATEGY.md)

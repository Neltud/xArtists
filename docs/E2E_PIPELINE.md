# Pipeline end-to-end xArtists

## Vellum / ops (chaque cycle)

```bash
export LIA_LIVE_TRADING=0 CHAIN=1
python -m lia.vellum.next_run
# → gas + board + hatom + orchestrator(Guardian) + mirror public/docs data
# → data/vellum_last_run.json
```

Puis commit/push des `data/*` + `apps/frontend/public/data/*` (GitHubReporter) → rebuild Pages.

## dApp lecture

| Source | Usage |
|--------|--------|
| `public/data/*.json` | Pages (priorité) |
| raw.githubusercontent.com | fallback |
| API MultiversX | prix EGLD, NFT wallet LIA |

## dApp écriture (TX)

| Gate | Condition |
|------|-----------|
| List/Buy/Bid NFT | `VITE_MARKETPLACE_CODEHASH_OK=1` + adresse ≠ empty known |
| Buy agent | `VITE_AGENTS_MARKETPLACE_ADDRESS` + `VITE_AGENTS_CODEHASH_OK=1` |
| LIA live trades | `LIA_LIVE_TRADING=1` + micro-proof |

`useMarketplaceTx` refuse toute TX si gate false.

## Deploy SC

Voir `docs/DEPLOYMENT_STEPS.md`.

## User journeys KPI

Studio → mint path · Market browse · Agents packs info · Buy $TRO (xExchange) · Wallet Connect (pas LIA).

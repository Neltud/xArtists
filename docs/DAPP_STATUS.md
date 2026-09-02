# xArtists dApp — status (2026-08-08)

## Live checks

| Endpoint | Attendu |
|----------|---------|
| Pages SPA | 200 |
| `/data/lia_board.json` | 200 après ce deploy |
| `/data/xartists_collections.index.json` | 200 |
| Marketplace codeHash | null jusqu'au deploy SC |

## Fait récemment

- Runbook deploy + post_deploy_verify auto + regression fast
- Seeds `docs/data/*` (board, index, status) — corrige 404 Pages
- `ensure_pages_data.sh` dans CI Pages (fail si board manquant)
- `DataHealthStrip` sur Dashboard (board + SC flags)
- UserWalletGuard List/Buy · SC banners dynamiques

## P0 restant (cash)

```bash
export PEM=... FEE_BPS=300 CHAIN=1
./scripts/runbook_deploy.sh all
# VITE_* CODEHASH_OK → rebuild
# Micro List/Buy wallet USER
```

## P1

- Mission + Reserve wallets (`set_treasury_wallets.py`)
- Index listings on-chain
- Vellum `./scripts/vellum_board_cadence.sh`

`LIA_LIVE_TRADING=0` jusqu'à micro-trades OK.

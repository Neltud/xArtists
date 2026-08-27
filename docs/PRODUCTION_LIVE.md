# Production live — xArtists dApp

**URL :** https://neltud.github.io/xArtists/

## Build (sandbox verified 2026-08-27)

```bash
cd apps/frontend
npm install
npm run build   # vite build — green
# dist/ ready; 404.html = index.html for SPA routes
```

## Données réelles

| Source | Usage |
|--------|--------|
| `api.multiversx.com/economics` | Prix EGLD, market cap, APR |
| LIA ops account API | Solde ~0.069 EGLD |
| `data/live_network_snapshot.json` | Snapshot publié |
| `data/entity_map.json` | Organigramme modules |
| Board / brain JSON | Paper LIA (Vellum `production_run`) |

## Pages deploy

Workflow : `Deploy xArtists dApp to GitHub Pages`  
Push `main` (apps/frontend|data) ou **Actions → Run workflow**.

SPA : `docs/404.html` copié depuis `index.html`.

## Limites prod honnêtes

- Marketplace / agents SC : codeHash null → pas de List/Buy on-chain
- TxShell : pas de bundle sdk-dapp (Vite 5 + Ledger BLE) — Web Wallet redirect OK
- LIA trading : paper jusqu’à micro-preuves + flag live

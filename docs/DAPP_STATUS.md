# xArtists dApp — status global (2026-08-08)

## Ce qui marche (consultation)

| Zone | État |
|------|------|
| Pages SPA | ✅ live |
| Galerie / Market UI | ✅ (catalog slim + virtual + progressive) |
| Dashboard LIA labels | ✅ |
| Wallet vs Portfolio | ✅ séparés |
| DAO read-only | ✅ (pas de vote faux) |
| Board seed JSON | ✅ seeds + deploy copy hardened |
| Trading stack (paper) | ✅ TP log, trail, slippage, arb, bridge latency |
| Pinata | ✅ connect OK |
| SC deploy scripts | ✅ optimized pipeline |

## Bloqué cash (P0)

| Item | État |
|------|------|
| nft-marketplace codeHash | ❌ null (compte vide) |
| agents_marketplace | ❌ null |
| List/Buy/Bid on-chain | ❌ attend deploy |
| LIA_LIVE_TRADING | **0** (volontaire) |

```bash
export PEM=...
./scripts/preflight_deploy_mainnet.sh
RUN_DEPLOY=1 ./scripts/deploy_optimized_mainnet.sh
python scripts/verify_marketplace_codehash.py
```

## Architecture rapide

```
User dApp (GH Pages)
  ├─ read: data/*.json (board, status, catalog)
  ├─ TX routes only: TxShell + sdk-dapp
  └─ banners until codeHash ≠ null

LIA Vellum (paper)
  ├─ Guardian → TradingStack → profit lock
  ├─ board.publish + publish_data_for_frontend
  └─ LIA_LIVE_TRADING=0

SC mainnet (pending)
  ├─ agents-marketplace FEE_BPS=300
  └─ nft-marketplace placeBid/acceptBid/…
```

## Prochaines actions (ordre)

1. Rebuild Pages (ce push) → vérifier `/data/lia_board.json` ≠ 404  
2. Deploy SC (PEM + EGLD)  
3. post_deploy + VITE_* + rebuild  
4. Micro List/Buy wallet **user**  
5. Vellum `python -m lia.board.publish` en cadence  
6. Mission/Reserve wallets treasury  

## Sécurité trading (rappel)

Guardian → leverage policy → slippage → TP/trail → lock 70 % → live flag  
Bridge = inventory-first, pas de fonds user auto-bridgés.  

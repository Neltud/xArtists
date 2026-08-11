# Project status — 2026-08-11

| Capacité | Prêt ? |
|----------|--------|
| Dashboard / Gallery / Board paper / labels | Oui |
| Commander UI (Guardian + Brain + Risk) | Oui (données via production_run) |
| Pin IPFS (Pinata) | Oui (JWT secret) |
| List / Buy / Bid NFT on-chain | **Non** — SC empty / codeHash null |
| Buy agent on-chain | **Non** — agents_marketplace null |
| Vote DAO on-chain | Non (UI read-first) |
| LIA live trading | **Non** — LIA_LIVE_TRADING=0 |
| Treasury splitter live | Non — wallets + deploy pending |

Gates: `allow_live_trading=false`.  
Operator: `python -m lia.vellum.production_run`.  
Audit: `docs/AUDIT_EXTERNAL_FULL.txt`.

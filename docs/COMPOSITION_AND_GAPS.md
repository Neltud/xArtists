# xArtists — composition complète + lacunes (2026-08-03)

## Composition totale

| Couche | Contenu |
|--------|---------|
| **FE shell** | Header PRIMARY_NAV, BottomNav, PWA, ErrorBoundary |
| **Routes** | `/` Dashboard, `/studio`, `/gallery`, `/marketplace`, `/agents`, `/trading`, `/portfolio`, `/tro`, **`/dao`**, `/hatom`, `/lp`, `/wallet`, `/tip`, `/staking`, experimental |
| **DAO** | Page **existe** (`DAO.tsx`) — était en secondaire ; **maintenant dans PRIMARY_NAV** |
| **LIA data** | `lia_board.json`, `lia_v6_status.json`, `lia_performance.json`, trades, gas |
| **SC code** | agents-marketplace, nft-marketplace (+bid), soul-zk stubs |
| **Vellum** | board/gas/hatom publish, orchestrator gated live |

## Galerie branding

- Titre principal : **xArtists**
- Crédit artiste : Nelson Tuduri (secondaire)

## Board LIA 404 — cause & fix

| Cause | Fix |
|-------|-----|
| Pas de fichier sur `main` / Pages | Seeds commités dans `data/` + `apps/frontend/public/data/` |
| URL unique raw only | Multi-fallback : BASE_URL/data → relative → raw → Pages |
| Vellum non run | `python -m lia.board.publish` + `python -m lia.vellum.next_run` |

**Après ce commit :** rebuild GH Pages pour servir `public/data/*`.

## P0 (bloquants live)

1. Signature `__xartistsSendTx` + login xPortal réel  
2. Deploy `agents_marketplace` + VITE_  
3. Redeploy marketplace (bid) si codehash ancien  
4. Board publish automatisé fin de run Vellum  
5. List/Buy E2E testé on-chain  
6. (Option) burn TRO + escrow SC upgrade  

## P1

GreenSmoke + trailing + Kelly · PerformanceTracker · LP live · Hatom HF · Playwright · CI · Lighthouse  

## Risques anticipés → solutions

| Risque | Solution |
|--------|----------|
| 404 data | Seeds + multi-URL + publish auto |
| Executor paper | Live gated ; circuit breaker 3 fails |
| sdk-dapp partial | Bootstrap + WC E2E |
| Branding | xArtists primary |
| BigInt / Hatom | labels N/A + BigInt |
| Supernova gas | limits recalibrés docs deploy |

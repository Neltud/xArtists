# P0 Status — 29 juillet 2026

## Livré dans le repo

| Item | Path | Statut |
|------|------|--------|
| Signature live UniversalExecutor (PEM) | `lia/executor/universal_executor.py` | 🟡 Skeleton — dry-run défaut, live si `LIA_LIVE_TRADING=1` + PEM |
| MARKETPLACE_ABI | `packages/core/src/contracts/marketplaceAbi.ts` | ✅ |
| Hook List/Buy | `apps/frontend/src/hooks/useMarketplaceTx.ts` | 🟡 À brancher sur `sendTransactions` + UI Gallery/Marketplace |
| SC Agents Marketplace | `contracts/agents-marketplace/` | 🟡 Code prêt — **déployer mxpy** → remplacer adresse |
| GreenSmokeConsumer + trailing | `lia/agents/green_smoke_consumer.py` | ✅ + `data/greensmoke_top.json` |
| Playwright E2E + CI | `e2e/smoke.spec.ts` + `.github/workflows/e2e.yml` | ✅ Smoke |

## Actions humaines restantes

1. **Secrets** (jamais en git) : `LIA_WALLET_PEM_PATH` / secret Vellum, `LIA_LIVE_TRADING=1` seulement après tests.
2. **Finaliser broadcast** dans UniversalExecutor avec `@multiversx/sdk-core` Transaction + gateway.
3. **UI** : dans `Marketplace.tsx` / `Gallery.tsx`, appeler `useMarketplaceTx().listNft/buyNft` avec wallet connecté.
4. **Deploy SC** :
   ```bash
   mxpy contract build contracts/agents-marketplace
   mxpy contract deploy --bytecode ... --pem wallet.pem --recall-nonce --gas-limit 80000000 --send
   ```
   Puis mettre l'adresse dans `VITE_MARKETPLACE_ADDRESS` / config.
5. **GreenSmoke** : API live → remplir `data/greensmoke_top.json` (top 10).
6. **Playwright** : ajouter `playwright.config.ts` + tests wallet mock.

## Critères done

- [ ] ≥ 1 tx mainnet signée par Executor (swap ou transfer test)
- [ ] List + Buy NFT depuis le dApp (wallet xPortal)
- [ ] Adresse SC Agents ≠ placeholder
- [ ] Trailing stop ferme une position en simulation
- [ ] Job E2E vert sur `main`

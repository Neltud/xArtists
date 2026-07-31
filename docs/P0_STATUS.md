# P0 Status — 31 juillet 2026 (Vellum final prep)

## Livré dans le repo

| Item | Path | Statut |
|------|------|--------|
| LIA asset policy (no hold TRO) | `lia/policy/asset_policy.py` + `data/lia_tro_policy.json` | ✅ |
| redistribute_tro executor | `lia/executor/universal_executor.py` | ✅ |
| Signature live UniversalExecutor (PEM) | idem | 🟡 dry-run défaut ; live si env |
| MARKETPLACE_ABI + hook List/Buy | `useMarketplaceTx.ts` + `useSendTransaction` | ✅ branché send |
| SC Agents Marketplace | `contracts/agents-marketplace/` + deploy script | 🟡 code prêt — **déployer mxpy** |
| Playwright E2E extended | `e2e/smoke.spec.ts` | ✅ |
| BTC bridge claim + views | `contracts/btc-bridge/.../bridge_logic.rs` | ✅ stabilisé (mint ESDT next) |
| Doc Vellum final | `docs/P0_VELLUM_FINAL.md` | ✅ |

## Actions humaines restantes

1. **Secrets** : `LIA_WALLET_PEM_PATH` + `LIA_LIVE_TRADING=1` seulement après tests dry-run.
2. **Deploy Agents SC** : `./scripts/deploy_agents_marketplace.sh` → coller adresse.
3. **UI** : boutons List/Buy dans Marketplace/Gallery → `useMarketplaceTx()`.
4. **Vellum node** : `tro_redistributor` sur détection balance TRO.
5. **sBTC** : config token id + mint dans bridge au prochain deploy.

## Critères done

- [ ] ≥ 1 tx mainnet signée par Executor (micro self-transfer)
- [ ] List + Buy NFT depuis le dApp (wallet xPortal)
- [ ] Adresse SC Agents ≠ placeholder
- [ ] TRO wallet LIA → 0 après cycle redistribute (pool/stake/rewards/burn)
- [ ] Job E2E vert sur `main`

*Neltud — 31 juil 2026*

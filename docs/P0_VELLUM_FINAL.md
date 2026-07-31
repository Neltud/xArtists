# P0 Vellum Final Construction — 31 juillet 2026

## Objectif
Préparer Vellum à la construction finale avec les 5 P0 prioritaires + règle LIA assets.

## Règle LIA (non négociable)
- **Accumule** : EGLD, WEGLD, WBTC/HWBTC, USDC uniquement.
- **Ne garde pas** $TRO dans le wallet opérationnel.
- **Tout TRO récupéré** → redistribué :
  - 40 % pool (LP TRO/EGLD OneDex)
  - 30 % stake (TRO staking SC)
  - 20 % rewards
  - 10 % burn

Fichiers :
- `lia/policy/asset_policy.py`
- `data/lia_tro_policy.json`
- `lia/executor/universal_executor.py` → `redistribute_tro()`

## 1. Deploy SC Agents Marketplace
```bash
export PEM=/path/to/wallet.pem   # secret — jamais en git
./scripts/deploy_agents_marketplace.sh
# → écrit data/contracts.json + adresse à coller dans VITE_AGENTS_MARKETPLACE_ADDRESS
```
SC prêt : `contracts/agents-marketplace/` (fee_bps init, list/buy/cancel).

## 2. List/Buy marketplace (sdk-dapp)
- Hook : `apps/frontend/src/hooks/useMarketplaceTx.ts`
  - `listNft` / `buyNft` appellent `useSendTransaction().send`
  - payloads ESDTNFTTransfer + `buyNft@listingId`
- UI Marketplace : brancher boutons Buy/List sur le hook (session wallet xPortal).
- Adresse : `VITE_MARKETPLACE_ADDRESS` ou placeholder dans `marketplaceAbi.ts`.

## 3. Signature live LIA
```bash
export LIA_WALLET_PEM_PATH=/secure/path/wallet.pem
export LIA_LIVE_TRADING=1
python -m lia.executor.universal_executor   # health + micro self-tx
```
Circuit breaker + dry-run par défaut. `redistribute_tro(amount)` applique la policy.

## 4. Playwright étendu
- `e2e/smoke.spec.ts` : routes, nav, PWA manifest, console errors.
- CI : `.github/workflows/e2e.yml`

## 5. Bridge BTC stabilisé
- `claimSbtc`, `getSbtcBalance`, `getTotalBridgedIn`, guards user/nonce/amount.
- Prochaine étape deploy : token id sBTC ESDT + mint réel.

## Checklist Vellum
- [ ] PEM en secret manager (pas git)
- [ ] Deploy agents-marketplace → adresse dans config
- [ ] Node Vellum `tro_redistributor` lit `lia_tro_policy.json`
- [ ] Node executor appelle `redistribute_tro` dès balance TRO > min_atomic
- [ ] Marketplace Buy/List testés sur devnet puis mainnet dust
- [ ] E2E vert sur `main`

*Neltud / Grok — 31 juil 2026*

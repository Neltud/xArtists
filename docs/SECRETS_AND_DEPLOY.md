# Secrets & déploiement SC — configuration complète

## 1. GitHub Actions Secret (obligatoire pour deploy CI)

1. Va sur **https://github.com/Neltud/xArtists/settings/secrets/actions**
2. **New repository secret**
3. Name : `LIA_WALLET_PEM`
4. Value : **contenu entier** du fichier `.pem` (y compris `-----BEGIN ...-----` / `-----END ...-----`)
5. Save

⚠️ Ne jamais committer ce fichier. Ne jamais le coller dans une issue / PR.

### Secrets optionnels (même page)

| Secret | Usage |
|--------|--------|
| `LIA_WALLET_PEM` | **Requis** — deploy SC + Executor live |
| `VITE_WALLETCONNECT_PROJECT_ID` | Frontend WalletConnect (si build CI) |
| `SENTRY_DSN` | Monitoring (si activé) |

---

## 2. Vellum Secrets (même PEM, parallèle)

| Secret Vellum | Valeur |
|---------------|--------|
| `LIA_WALLET_PEM` | Même contenu PEM |
| `LIA_CHAIN_ID` | `1` ou `D` |
| `LIA_MVX_PROXY` | gateway mainnet / devnet |
| `FEE_BPS` | `300` |
| `DEPLOY_CONTRACT` | `all` |

Node : `from lia.vellum.deploy_scs_node import run; print(run())`

---

## 3. Lancer le deploy GitHub Actions

1. **Actions** → **Deploy Smart Contracts**
2. **Run workflow**
3. Choisir :
   - **chain** : `D` (devnet) d’abord, puis `1` (mainnet)
   - **contract** : `all` ou un seul
   - **fee_bps** : `300`
   - **commit_addresses** : true → met à jour `data/contracts.json` sur main
4. Attendre le ✅
5. Vérifier les adresses dans les logs + `data/contracts.json`
6. Explorer : https://explorer.multiversx.com (ou devnet-explorer)

Workflow file : `.github/workflows/deploy-scs.yml`

---

## 4. Prérequis wallet

- Le wallet du PEM doit avoir assez d’**EGLD** pour le gas (devnet faucet / mainnet réel)
- Recommandé : wallet **deployer** dédié (peu de fonds), pas le cold storage LIA entier

---

## 5. Après deploy réussi

1. Adresses dans `data/contracts.json`
2. Frontend :
   - `VITE_MARKETPLACE_ADDRESS=<marketplace_nft>`
   - `VITE_AGENTS_MARKETPLACE_ADDRESS=<agents_marketplace>`
3. `packages/core/src/contracts/marketplaceAbi.ts` — aligner l’adresse
4. Test list/buy avec petit montant

---

## 6. Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `.github/workflows/deploy-scs.yml` | CI deploy |
| `lia/vellum/deploy_scs_node.py` | Logique build+deploy (Vellum + CI) |
| `scripts/deploy_all_scs.sh` | Deploy local optionnel |
| `data/contracts.json` | Adresses (safe to commit) |
| `contracts/nft-marketplace/` | SC NFT |
| `contracts/agents-marketplace/` | SC Agents |

---

## 7. Dépannage

| Erreur | Cause |
|--------|--------|
| Secret LIA_WALLET_PEM is not set | Ajouter le secret dans Settings |
| build failed / no wasm | Toolchain Rust/wasm ; logs build |
| insufficient funds | EGLD manquant sur le wallet PEM |
| Could not parse address | Lire log_tail mxpy ; nonce / chain |

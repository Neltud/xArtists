# Commandes de déploiement SC — MultiversX MAINNET

**Réseau uniquement :** `CHAIN=1` · Proxy `https://gateway.multiversx.com`  
**PEM jamais dans git.** `LIA_LIVE_TRADING=0` pendant le deploy.

---

## Variables d’environnement

```bash
export CHAIN=1
export FEE_BPS=300
export LIA_LIVE_TRADING=0
export PEM=/chemin/securise/mainnet.pem
# équivalent Vellum :
# export LIA_WALLET_PEM_PATH=/chemin/securise/mainnet.pem
export PROXY=https://gateway.multiversx.com
# optionnel : cibler un contrat
# export ONLY=nft-marketplace   # ou agents-marketplace | all
```

Balance déployeur recommandée : **≥ 0.25 EGLD**.  
Le node `lia.vellum.deploy_scs_node` refuse désormais le **vrai deploy** si le wallet ops est sous ce seuil.

---

## Chemin canonique (recommandé)

```bash
# 1) Dry — build WASM + estimation gas + balance — 0 TX
./scripts/runbook_deploy.sh dry

# 2) Deploy réel (envoie des TX)
./scripts/runbook_deploy.sh deploy

# 3) Verify codeHash + cohérence + rapport
./scripts/runbook_deploy.sh verify

# Ou tout d’un coup :
./scripts/runbook_deploy.sh all
```

Rapport : `data/post_deploy_report.json`

---

## Build WASM seul (pas de TX)

```bash
./scripts/build_scs_isolated.sh all
./scripts/build_scs_isolated.sh nft-marketplace
./scripts/build_scs_isolated.sh agents-marketplace
```

---

## Deploy ciblé

```bash
# Les deux marketplaces (build + deploy_all)
./scripts/deploy_mainnet.sh
./scripts/deploy_mainnet.sh all

# Un seul contrat
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace
```

Autres scripts utiles :

```bash
./scripts/deploy_agents_marketplace.sh
./scripts/deploy_treasury_splitter.sh   # après wallets Mission/Reserve/Reward/Ops
./scripts/deploy_tro_burn.sh
./scripts/deploy_optimized_mainnet.sh  # utilisé par runbook phase deploy
./scripts/preflight_deploy_mainnet.sh  # dry interne
./scripts/simulate_deploy_mainnet.sh   # simulation légère
```

---

## Post-deploy (adresses + codeHash)

```bash
# Enregistrer les adresses déployées
python scripts/post_deploy_contracts.py \
  --marketplace erd1qqqq... \
  --agents erd1qqqq...

# Vérifier codeHash on-chain (doit exit 0 avant flags VITE)
python scripts/verify_marketplace_codehash.py

# Suite automatisée (vues + lag API)
bash scripts/post_deploy_verify.sh --query-views
# ou :
python scripts/post_deploy_verify.py
```

Générer env Vite (après verify OK) :

```bash
python scripts/generate_vite_env.py
# puis rebuild Pages avec VITE_MARKETPLACE_CODEHASH_OK=1 et VITE_AGENTS_CODEHASH_OK=1
```

```bash
cd apps/frontend
export VITE_MARKETPLACE_CODEHASH_OK=1
export VITE_AGENTS_CODEHASH_OK=1
npm ci && npm run build
# push main → Actions Pages
```

Ou helper :

```bash
bash scripts/post_deploy_to_pages.sh
```

---

## Vellum (deploy opt-in)

Secrets vault uniquement : `LIA_WALLET_PEM` / `LIA_WALLET_PEM_PATH`, jamais dans le repo.

```bash
export CHAIN=1 LIA_LIVE_TRADING=0
export VELLUM_DEPLOY_SCS=1
export PEM=/secure/mainnet.pem   # ou LIA_WALLET_PEM_PATH
PYTHONPATH=. python -m lia.vellum.production_run
# phase deploy_scs appelle lia.vellum.deploy_scs_node si flag + PEM OK
# et seulement après cycle paper + mirror public OK
```

Sans `VELLUM_DEPLOY_SCS=1` → phase **skipped** (comportement normal paper).

---

## Ordre produit strict

1. `runbook_deploy.sh dry`  
2. `runbook_deploy.sh deploy` (nft + agents)  
3. `verify_marketplace_codehash.py` **exit 0**  
4. `post_deploy_verify.py` met à jour `data/config.json` + `.env.mainnet.example`  
5. Flags `VITE_*_CODEHASH_OK=1` + rebuild Pages  
6. Micro List/Buy avec **wallet utilisateur** (pas LIA ops)  
7. Treasury wallets → `deploy_treasury_splitter.sh`  
8. Garder `LIA_LIVE_TRADING=0` jusqu’aux micro-preuves trading  

---

## Interdits

- Deploy si `CHAIN != 1`  
- Commit PEM / `.env` avec secrets  
- Activer banners market/agents sans codeHash vérifié  
- Confondre wallet user Connect et wallet LIA ops deployer  

Erreurs : [`DEPLOY_ERRORS.md`](DEPLOY_ERRORS.md) · Runbook : [`DEPLOYMENT_STEPS.md`](DEPLOYMENT_STEPS.md) · Build global : [`BUILD_STEPS.md`](BUILD_STEPS.md)

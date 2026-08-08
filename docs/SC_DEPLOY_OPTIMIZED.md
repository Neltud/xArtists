# Smart Contract deploy — optimisé (mainnet only)

## Objectif

Réduire les échecs (gas, balance, parse adresse) et le temps de diagnostic pour **agents-marketplace** + **nft-marketplace**.

## Pipeline recommandé

```bash
export PEM=/path/to/mainnet.pem   # jamais commit
export FEE_BPS=300
export CHAIN=1

# 1) Preflight (build + balance + GAS_LIMIT par wasm)
./scripts/preflight_deploy_mainnet.sh
# ou
./scripts/simulate_deploy_mainnet.sh

# 2) Deploy réel (un ou les deux)
RUN_DEPLOY=1 ./scripts/deploy_optimized_mainnet.sh
# ou ciblé :
RUN_DEPLOY=1 ONLY=agents-marketplace ./scripts/deploy_optimized_mainnet.sh
RUN_DEPLOY=1 ONLY=nft-marketplace ./scripts/deploy_optimized_mainnet.sh

# 3) Vérifier
python scripts/verify_marketplace_codehash.py
# codeHash ≠ null sur explorer

# 4) Frontend
# VITE_*_ADDRESS + VITE_*_CODEHASH_OK=1 → rebuild Pages
```

Legacy (toujours valide) :

```bash
./scripts/deploy_mainnet.sh agents-marketplace
./scripts/deploy_mainnet.sh nft-marketplace
```

## Optimisations implémentées

| Optimisation | Fichier | Effet |
|--------------|---------|--------|
| Gas depuis taille WASM + buffer 35 % | `estimate_deploy_gas.py` | Moins d’*out of gas* / moins de surpay |
| Floor 120M / cap 600M | idem | Respect hard-limit réseau |
| Balance min ~0.15 EGLD | `preflight_deploy_mainnet.sh` | Stop avant send si fonds insuffisants |
| Build isolé | `build_scs_isolated.sh` | Pas de workspace SC cassé |
| Retry gateway + **bump gas** auto | `deploy_optimized_mainnet.sh` | Récupération OOG / 502 |
| Confirm adaptive (1s→8s) | `confirm_tx_mainnet.py` | Finality Supernova sans spam API |
| Pas d’adresse fake | deploy scripts | `contracts.json` seulement si confirm OK |
| post_deploy + codehash enchaînés | deploy_optimized | Une commande pour la suite frontend |

## Formule gas (indicatif)

```
data_est = 80_000 + 1_800 * wasm_bytes
recommended = min(600_000_000, max(120_000_000, data_est * 1.35))
```

Ajuster si init SC devient plus lourd (nouveaux endpoints).

## Coûts approximatifs

| Étape | EGLD (ordre de grandeur) |
|-------|---------------------------|
| Deploy 1 SC | ~0.05–0.15 (gas + data) |
| 2 SC + buffer | **≥ 0.15–0.30** recommandé sur le wallet |
| Micro list/buy test | variable, garder marge |

Wallet LIA ops : vérifier le solde live avant `RUN_DEPLOY=1`.

## Erreurs fréquentes → action

Voir aussi `docs/DEPLOY_ERRORS.md`.

| Symptôme | Action |
|----------|--------|
| out of gas | `GAS_LIMIT_OVERRIDE=500000000 RUN_DEPLOY=1 …` |
| insufficient funds | top-up EGLD sur deployer |
| codeHash null après deploy | attendre indexation API / re-run verify |
| adresse non parsée | explorer par tx hash → `post_deploy_contracts.py --agents erd1…` |

## Vellum

```text
PEM from secret LIA_WALLET_PEM_PATH only
CHAIN=1 FEE_BPS=300
preflight → RUN_DEPLOY=1 only when ops explicit
Never LIA_LIVE_TRADING=1 until micro-trades OK
On failure: stop, redact PEM, no fake contracts.json
```

## Après succès

1. Blackbox `docs/MAINNET_DEPLOY_BLACKBOX.md`
2. Retirer bandeaux « SC non déployé » (env CODEHASH_OK)
3. Micro List/Buy wallet **utilisateur** (pas LIA ops en session)

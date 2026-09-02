# Smart Contract deploy — optimisé (mainnet only)

> **Entrée canonique:** [`docs/RUNBOOK_DEPLOY.md`](RUNBOOK_DEPLOY.md)  
> **Orchestrateur:** `./scripts/runbook_deploy.sh <dry|deploy|verify|all>`

## Objectif

Réduire les échecs (gas, balance, parse adresse) pour **agents-marketplace** + **nft-marketplace**.

## Pipeline

```bash
export PEM=/path/to/mainnet.pem FEE_BPS=300 CHAIN=1
./scripts/runbook_deploy.sh dry
./scripts/runbook_deploy.sh deploy
./scripts/runbook_deploy.sh verify
```

Sous le capot: `preflight_deploy_mainnet.sh` → `deploy_optimized_mainnet.sh` → `verify_marketplace_codehash.py` → `generate_vite_env.py`.

## Optimisations

| Optimisation | Effet |
|--------------|--------|
| Gas = taille WASM × 1.35 (floor 120M, cap 600M) | Moins OOG / surpay |
| Balance min ~0.15–0.25 EGLD | Stop avant send |
| Build isolé | Workspace SC indépendant |
| Retry gateway + bump gas | Récupération 502 / OOG |
| Confirm adaptive 1s→8s | Finality Supernova |
| Pas d'adresse fake | contracts.json seulement si confirm OK |
| Phases runbook | dry gratuit avant deploy payant |

## Formule gas

```
data_est = 80_000 + 1_800 * wasm_bytes
recommended = min(600_000_000, max(120_000_000, data_est * 1.35))
```

## Coûts

| Étape | EGLD |
|-------|------|
| dry | 0 |
| Deploy 1 SC | ~0.05–0.15 |
| 2 SC + buffer | **>= 0.25** recommandé |

## Erreurs → action

| Symptôme | Action |
|----------|--------|
| out of gas | `GAS_LIMIT_OVERRIDE=500000000 ./scripts/runbook_deploy.sh deploy` |
| insufficient funds | top-up deployer |
| codeHash null | re-run `verify` après 30–90 s |
| adresse non parsée | explorer tx → `post_deploy_contracts.py` |

## Après succès

1. VITE + rebuild Pages  
2. Micro List/Buy wallet **user**  
3. `LIA_LIVE_TRADING=0` jusqu'à preuve micro  

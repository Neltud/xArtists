# RUNBOOK DEPLOY — xArtists mainnet (canonical)

**Une seule entrée.** Les autres docs (`DEPLOYMENT_STEPS`, `SC_DEPLOY_OPTIMIZED`, `POST_DEPLOY_CHECKLIST`) pointent ici.

| | |
|--|--|
| Réseau | **Mainnet only** `CHAIN=1` |
| SC | `agents-marketplace` + `nft-marketplace` |
| Fee | `FEE_BPS=300` (3 %) |
| Owner | Wallet **LIA Ops** (PEM) — jamais session user List/Buy |
| Live trading | `LIA_LIVE_TRADING=0` jusqu’à micro-trades OK |

---

## 0. Prérequis (2 min)

| Check | Commande / critère |
|-------|-------------------|
| mxpy | `mxpy --version` |
| PEM | `export PEM=/path/mainnet.pem` (hors git) |
| Solde | ≥ **0.25 EGLD** recommandé (2 SC + marge) |
| Repo | `git pull` sur `main` |
| Devnet | **interdit** |

```bash
export PEM=/secure/mainnet.pem
export FEE_BPS=300 CHAIN=1
export LIA_LIVE_TRADING=0
```

---

## 1. Une commande (recommandé)

```bash
# Phase A — dry-run (build + gas + balance, 0 tx)
./scripts/runbook_deploy.sh dry

# Phase B — envoi on-chain (après lecture dry OK)
./scripts/runbook_deploy.sh deploy

# Phase C — codeHash + VITE snippet
./scripts/runbook_deploy.sh verify

# Ou tout enchaîner (stop si échec)
./scripts/runbook_deploy.sh all
```

| Phase | Durée approx. | Coût |
|-------|---------------|------|
| `dry` | 1–5 min | 0 EGLD |
| `deploy` | 2–10 min | ~0.10–0.25 EGLD |
| `verify` | &lt; 1 min | 0 |
| Pages rebuild | 2–5 min CI | 0 |

---

## 2. Pipeline détaillé

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐
│  preflight  │ →  │ deploy ×2    │ →  │ codeHash    │ →  │ VITE +   │
│  build+gas  │    │ confirm poll │    │ verify OK   │    │ Pages    │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────┘
       │                  │                   │                 │
   stop if bal        retry OOG/502      stop if null      bandeau off
   or wasm fail       no fake addr
```

### Scripts sous-jacents

| Étape | Script |
|-------|--------|
| Preflight | `preflight_deploy_mainnet.sh` |
| Gas | `estimate_deploy_gas.py` |
| Deploy | `deploy_optimized_mainnet.sh` |
| Confirm | `confirm_tx_mainnet.py` (1s→8s) |
| Merge JSON | `post_deploy_contracts.py` |
| Verify | `verify_marketplace_codehash.py` |
| VITE | `generate_vite_env.py` |
| Pages hook | `post_deploy_to_pages.sh` |

### Ciblage

```bash
ONLY=agents-marketplace ./scripts/runbook_deploy.sh deploy
ONLY=nft-marketplace    ./scripts/runbook_deploy.sh deploy
GAS_LIMIT_OVERRIDE=500000000 ./scripts/runbook_deploy.sh deploy
```

---

## 3. Critères de succès

| Artefact | Attendu |
|----------|---------|
| `data/contracts.deployed.json` | 2 adresses `erd1qqqq…` + tx hashes |
| `data/contracts.json` | `marketplace` + `agents_marketplace` renseignés |
| `data/marketplace_codehash_live.json` | `
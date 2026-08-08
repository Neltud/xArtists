# RUNBOOK DEPLOY — xArtists mainnet (canonical)

**Une seule entrée.** Les docs `DEPLOYMENT_STEPS`, `SC_DEPLOY_OPTIMIZED`, `POST_DEPLOY_CHECKLIST` renvoient ici.

| Param | Valeur |
|-------|--------|
| Réseau | **Mainnet only** `CHAIN=1` |
| SC | `agents-marketplace` + `nft-marketplace` |
| Fee | `FEE_BPS=300` (3 %) |
| Owner | Wallet **LIA Ops** (PEM) |
| Live trading | `LIA_LIVE_TRADING=0` jusqu'à micro-trades OK |

---

## 0. Prérequis (~2 min)

| Check | Critère |
|-------|---------|
| mxpy | installé |
| PEM | `export PEM=/path/mainnet.pem` (hors git) |
| Solde | >= **0.25 EGLD** recommandé |
| Repo | `git pull` sur `main` |
| Devnet | **interdit** |

```bash
export PEM=/secure/mainnet.pem
export FEE_BPS=300 CHAIN=1
export LIA_LIVE_TRADING=0
```

---

## 1. Une commande

```bash
./scripts/runbook_deploy.sh dry      # build + gas + balance — 0 tx
./scripts/runbook_deploy.sh deploy  # envoi on-chain
./scripts/runbook_deploy.sh verify  # codeHash + VITE snippet
./scripts/runbook_deploy.sh all     # dry → deploy → verify (stop si fail)
```

| Phase | Durée | Coût |
|-------|-------|------|
| dry | 1–5 min | 0 EGLD |
| deploy | 2–10 min | ~0.10–0.25 EGLD |
| verify | < 1 min | 0 |
| Pages CI | 2–5 min | 0 |

---

## 2. Pipeline

```
preflight (build+gas) → deploy×2 (confirm) → codeHash verify → VITE + Pages
     stop if bal/wasm fail     no fake addr        stop if null      bandeau off
```

| Étape | Script |
|-------|--------|
| Preflight | `preflight_deploy_mainnet.sh` |
| Gas | `estimate_deploy_gas.py` |
| Deploy | `deploy_optimized_mainnet.sh` |
| Confirm | `confirm_tx_mainnet.py` |
| Merge JSON | `post_deploy_contracts.py` |
| Verify | `verify_marketplace_codehash.py` |
| VITE | `generate_vite_env.py` |

Ciblage:

```bash
ONLY=agents-marketplace ./scripts/runbook_deploy.sh deploy
ONLY=nft-marketplace    ./scripts/runbook_deploy.sh deploy
GAS_LIMIT_OVERRIDE=500000000 ./scripts/runbook_deploy.sh deploy
```

---

## 3. Critères de succès

| Artefact | Attendu |
|----------|---------|
| `data/contracts.deployed.json` | 2 adresses + tx hashes |
| `data/contracts.json` | marketplace + agents renseignés |
| `data/marketplace_codehash_live.json` | `ok: true` pour les deux |
| `apps/frontend/.env.mainnet.example` | `CODEHASH_OK=1` |
| Pages | bandeau SC absent si env injecté |

---

## 4. Après verify OK — frontend

1. Copier les `VITE_*` de `.env.mainnet.example` dans `deploy-pages.yml` (env build).
2. Commit + push `data/contracts.json` + `marketplace_codehash_live.json`.
3. Attendre Actions → Pages live.
4. Micro List/Buy avec **wallet user** (jamais `erd1p4zy…` LIA ops).
5. Blackbox: `docs/MAINNET_DEPLOY_BLACKBOX.md` si présent.

```bash
./scripts/post_deploy_to_pages.sh
# puis git commit / push manuellement après review
```

---

## 5. Matrice d'erreurs (rapide)

| Symptôme | Action |
|----------|--------|
| insufficient funds | Top-up >= 0.25 EGLD sur deployer |
| out of gas | `GAS_LIMIT_OVERRIDE=500000000` puis redeploy |
| codeHash null | Attendre indexation API 30–90 s ; re-run `verify` |
| adresse non parsée | Explorer tx → `post_deploy_contracts.py --agents erd1… --marketplace erd1…` |
| gateway 502/503 | Retry auto (MAX_RETRIES=2) ; sinon attendre |
| PEM invalid | Régénérer / chemin secret Vellum |
| Buy UI encore bloqué | `VITE_*_CODEHASH_OK` pas injecté dans CI |

Détail: `docs/DEPLOY_ERRORS.md`.

---

## 6. Rollback / ne pas faire

- **Ne pas** écrire d'adresse inventée dans `contracts.json`.
- **Ne pas** activer Buy si un seul SC est live.
- **Ne pas** `LIA_LIVE_TRADING=1` avant micro List/Buy OK.
- **Ne pas** utiliser le wallet LIA en session dApp pour List/Buy.
- SC déjà déployé sans les endpoints = **redeploy** (upgrade policy séparée).

---

## 7. Vellum (ops autonome)

```text
Secret: LIA_WALLET_PEM_PATH only (never log PEM)
CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0
1) runbook_deploy.sh dry
2) Human gate OR explicit RUN_DEPLOY=1
3) runbook_deploy.sh deploy
4) runbook_deploy.sh verify
5) If all_ok: commit contracts.json + open Pages rebuild
6) Stop on any fail — no fake addresses
```

---

## 8. Ordre de coût / risque

1. `dry` — gratuit, obligatoire avant premier deploy  
2. `deploy` agents puis nft (script default)  
3. `verify` — gate UI  
4. Pages + micro TX user  
5. claimFees → split Mission/Reserve (après création wallets)  

**Commande unique à retenir:** `./scripts/runbook_deploy.sh all`

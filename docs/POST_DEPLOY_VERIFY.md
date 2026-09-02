# Post-deploy verification — automated

## Commande

```bash
# Après deploy (ou seul)
./scripts/post_deploy_verify.sh

# Avec options
python scripts/post_deploy_verify.py --retry 5 --retry-wait 12 --query-views
python scripts/post_deploy_verify.py --strict

# Via runbook
./scripts/runbook_deploy.sh verify
```

## Checks automatiques

| # | Check | Critique ? |
|---|--------|------------|
| 1 | Adresse `erd1` dans `contracts.json` | oui |
| 2 | Compte API mainnet reachable | oui |
| 3 | `codeHash` non-null (contrat LIVE) | oui |
| 4 | Cohérence `contracts.deployed.json` ↔ `contracts.json` | oui si deploy file présent |
| 5 | `LIA_LIVE_TRADING=0` | soft (warn) |
| 6 | VM query `getFeeBps` (optionnel `--query-views`) | soft |
| 7 | Génération `VITE_*` + `.env.mainnet.example` | auto si PASS |

## Sorties

| Fichier | Contenu |
|---------|---------|
| `data/post_deploy_report.json` | Rapport complet |
| `data/marketplace_codehash_live.json` | Mirror all_ok + vite |
| `data/contracts.json` | Section `verification` mise à jour |
| `apps/frontend/.env.mainnet.example` | Flags CODEHASH_OK |

## Exit codes

| Code | Signification |
|------|----------------|
| **0** | Critical PASS — autoriser inject VITE + Pages |
| **1** | Soft issues sous `--strict` |
| **2** | Critical FAIL — **ne pas** activer List/Buy |

## Retry (indexation API)

Après un deploy frais, l’API peut mettre 30–90 s à exposer `codeHash`.  
Par défaut: **4 retries × 12 s**.

```bash
POST_DEPLOY_RETRIES=6 POST_DEPLOY_RETRY_WAIT=15 ./scripts/post_deploy_verify.sh
```

## Gate produit

```json
"gate": {
  "enable_list_buy_ui": true|false,
  "enable_lia_live_trading": false
}
```

`enable_list_buy_ui` = true **seulement** si marketplace **et** agents sont LIVE.

## CI (optionnel)

```yaml
- name: Post-deploy verify
  run: ./scripts/post_deploy_verify.sh
  # continue-on-error: true  # si pas encore déployé
```

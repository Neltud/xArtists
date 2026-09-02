# Optimisation temps d'exécution

## Regression

| Levier | Gain |
|--------|------|
| Single-process `run_all.py` | Évite ~0.3–0.8s × N cold starts |
| Pas de double pytest + self-test | ÷2 sur CI |
| `REGRESSION_FAILFAST` | Stop au 1er fail |
| Path filters workflow | Moins de runs inutiles |

```bash
time ./scripts/run_regression.sh
```

## Deploy / confirm

| Levier | Détail |
|--------|--------|
| confirm_tx intervals | 0.4s → 6s (Supernova) |
| timeout défaut | 120s (était 180) |
| HTTP timeout poll | 12s |
| post_deploy retries | seulement si codeHash null |

## Frontend Pages

| Levier | Détail |
|--------|--------|
| slim_collections | catalog ~280KB → ~72KB |
| virtual grid | >500 tiles |
| TxShell lazy | sdk-dapp hors routes non-TX |
| SW cache v3 | assets hashés |

## Vellum cadence

Board publish : 5–15 min suffit (pas de sub-second).  
`LIA_LIVE_TRADING=0` → pas de coût latence exécution live.

# Tests de régression — xArtists

## Lancer (rapide — défaut)

```bash
export LIA_LIVE_TRADING=0
./scripts/run_regression.sh
# → tests/regression/run_all.py  (1 process Python, tous les test_*)
```

Cible locale : **quelques secondes**, pas des dizaines.

### Modes

| Mode | Commande | Usage |
|------|----------|--------|
| **fast** (défaut) | `./scripts/run_regression.sh` | CI + dev |
| pytest | `REGRESSION_MODE=pytest ./scripts/run_regression.sh` | debug assert |
| legacy | `REGRESSION_MODE=legacy ./scripts/run_regression.sh` | 1 process / fichier |

```bash
REGRESSION_FAILFAST=1 REGRESSION_QUIET=1 ./scripts/run_regression.sh
```

## Optimisations temps

| Avant | Après |
|-------|--------|
| 13× `python3 file.py` (cold start chacun) | **1 process** charge tous les modules |
| pytest **en plus** des self-tests (double run) | Un seul passage |
| CI timeout 15 min + pip upgrade | timeout 8 min, cache pip, pas de double suite |
| confirm_tx start 1s | start **0.4s**, timeout défaut 120s |

## Périmètre

- `tests/regression/*` (data, post-deploy mock, trading gates, sc flags)
- bridge / guardian / secure_tp / slippage / claude_agent / circuit / statarb / symbiosis

## CI

`.github/workflows/regression.yml` — concurrency cancel-in-progress, path filters PR, artifact report 14j.

## Post-deploy

```bash
./scripts/run_regression.sh            # offline rapide
./scripts/runbook_deploy.sh verify     # on-chain (réseau)
```

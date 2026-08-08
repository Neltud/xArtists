# Tests de régression — xArtists

## Lancer localement

```bash
export LIA_LIVE_TRADING=0
./scripts/run_regression.sh
```

Avec pytest (optionnel) :

```bash
pip install pytest
pytest -q tests/regression
```

## Périmètre

| Suite | Contenu |
|-------|---------|
| `tests/regression/test_data_contracts.py` | Shape `contracts.json`, board, treasury, live flag |
| `tests/regression/test_post_deploy_logic.py` | codeHash helpers, vite flags, cohérence (mock API) |
| `tests/regression/test_trading_stack_gates.py` | Guardian, bridge inventory, slippage, live=0 |
| `tests/regression/test_sc_status_flags.py` | List/Buy gates + LIA ops detection |
| Modules existants | bridge, guardian, secure_tp, slippage, claude_agent, circuit |

## CI

Workflow : `.github/workflows/regression.yml`  
Triggers : push/PR sur `lia/`, `scripts/`, `tests/`, data critiques  
Artifact : `regression_report.json`

## Post-deploy

Les tests de régression **ne remplacent pas** `post_deploy_verify` (on-chain).  
Ordre ops :

```bash
./scripts/run_regression.sh          # offline, avant/après code change
./scripts/runbook_deploy.sh deploy   # mainnet
./scripts/runbook_deploy.sh verify   # on-chain automated
```

## Exit

| Code | Signification |
|------|----------------|
| 0 | Tout PASS |
| 1 | Au moins un FAIL |

`data/regression_report.json` toujours écrit (si le runner atteint la fin).

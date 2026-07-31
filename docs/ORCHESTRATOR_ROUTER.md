# OrchestratorRouter — Vellum

**Fichier :** `nodes/orchestrator_router.py`  
**Dépendance :** `lia/orchestration/symbiosis.py`

## Rôle

Point unique de **routing** après les cerveaux parallèles. Remplace le routeur « documenté seulement » par une source de vérité testable.

```
BalanceGuard
    → [LIABrain | TP1 | TP3 | TP5 | Contrarian | Risk | Yield]  (parallèle)
    → OrchestratorRouter
    → UniversalExecutor (série) / alertes si BLOCKED
```

## Routes

| `route` | Condition |
|---------|-----------|
| **BLOCKED** | BalanceGuard BLOCKED, circuit breaker, HF &lt; 1.5, ou RiskAgent BLOCK |
| **STRONG_BUY** | ≥2 stratégies BUY, confiance moyenne ≥ 0.75 |
| **TRADE** | Au moins 1 BUY approuvé par symbiosis |
| **YIELD_ONLY** | Pas d’entry (ou RISK_OFF) — yield / wait |

## Inputs principaux

| Input | Type | Description |
|-------|------|-------------|
| `brain_outputs` | list[dict] | Liste agrégée des brains |
| `tp1` … `tp5`, `lia_brain`, `contrarian` | dict | Slots individuels optionnels |
| `risk_output` | dict | RiskAgent |
| `yield_output` | dict | YieldAgent |
| `deployable_usd` | float | Capital déployable |
| `gs_regime` | str | RISK_ON / RISK_OFF / NEUTRAL |
| `balance_guard_status` | str | OK / WARNING / BLOCKED |
| `circuit_breaker_active` | bool | |
| `hatom_health_factor` | float | |

## Outputs principaux

| Output | Usage |
|--------|--------|
| `route` | Branche Vellum (conditional edge) |
| `executor_actions` | → `UniversalExecutor.actions` |
| `approved_actions` / `rejected` | Audit / Telegram |
| `budget_map` / `total_budget_pct` | Cap 85 % |
| `summary` | Log une ligne |

## Câblage Vellum (recommandé)

1. Nœuds brains en **parallèle** → merge node qui construit `brain_outputs` **ou** mapper chaque sortie vers `tp1`, `tp3`, …
2. `OrchestratorRouter.route` :
   - `BLOCKED` → AlertDispatcher / TelegramNotifier
   - `YIELD_ONLY` → Yield path / Hatom supply only
   - `TRADE` | `STRONG_BUY` → `UniversalExecutor` avec `actions = executor_actions`
3. Exécution **série** (nonce) — ne pas fan-out 5 exécuteurs sans fusion.

## Test local

```bash
python -c "
from nodes.orchestrator_router import OrchestratorRouter
# Requires vellum in env; logic tested via tests/test_symbiosis.py + fuse_votes
"
python tests/test_symbiosis.py
```

*Neltud — 31 juil 2026*

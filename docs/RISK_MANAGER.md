# Risk Manager — emergency drawdown lock

## Intent

Si le **drawdown** (perte depuis le pic) dépasse le plafond (défaut **15 %**), le système passe en **LOCKED** :

- plus de size-up Guardian / Executor
- signal essaim LIA : cesse operations
- unlock **manuel ops uniquement** (`UNLOCK_RISK_MANAGER`)

## Code

| Couche | Path |
|--------|------|
| SC référence | `contracts/risk-manager/types_reference.rs` |
| Off-chain (live paper) | `lia/security/risk_manager.py` |
| Fil Guardian | `lia/vellum/guardian_hook.check_before_open` appelle RiskManager **avant** spiral |

```python
from lia.security.risk_manager import RiskManager, check_drawdown

check_drawdown(0.10)  # ok
check_drawdown(0.20)  # lock + EMERGENCY_LOCKDOWN
```

État : `data/risk_manager_state.json` (mirrored public/data).

## EV Monte-Carlo (complément)

```python
from lia.brain.probabilistic import calculate_ev, LIAProbabilisticEngine

ev, p_profit = calculate_ev(amount, price_diff, volatility, delay_range, gas_cost=1.0)
```

## Deploy SC

Pas encore déployé. Après audit : build/deploy comme les autres SC, puis codeHash + VITE.  
Jusque-là l’off-chain RiskManager est la source de vérité paper.

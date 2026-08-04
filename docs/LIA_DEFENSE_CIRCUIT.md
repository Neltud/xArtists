# Circuit de défense LIA

Module : `lia/circuit/defense_circuit.py`  
Branché dans : `lia/circuit/mode_orchestrator.py`  
État : `data/lia_defense_state.json`

## Triggers (entrée DEFENSE)

| Code | Condition | Sévérité |
|------|-----------|----------|
| GS_RISK_OFF | `gs_regime == RISK_OFF` | hard |
| FEAR | fear_greed ≤ **25** | hard |
| DD_SOFT | drawdown ≥ **12%** vs peak | soft |
| DD_HARD | drawdown ≥ **15%** | hard + recommend_halt |
| HF | Hatom HF < **1.5** | hard + halt |
| LOSS_STREAK | pertes consécutives ≥ 3 | hard + halt |
| HALT | manual / circuit halt | hard |
| SOCIAL_RUMOR | rumor + bias SELL/WAIT | soft |

## Effets

- `allow_buy = False`
- Actions autorisées : **SELL**, **YIELD**, **HOLD**, **WAIT**
- Mode forcé : **DEFENSE** (prioritaire sur MOM/MR/ARB)
- Positions ouvertes : toujours gérées par COMPOUND / G14 (SL/TP) hors de ce module

## Sortie DEFENSE

`can_exit_defense` : aucun trigger actif + fear ≥ **40** + DD < 12%.

## Vellum

```bash
python -m lia.circuit.defense_circuit
python -m lia.circuit.mode_orchestrator
```

Toujours `LIA_LIVE_TRADING=0` jusqu’à validation micro-trades.

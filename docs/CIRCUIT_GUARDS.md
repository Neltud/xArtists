# Garde-fous Circuit LIA — Implémentation

**Module** : `lia/circuit/guards.py`  
**Cycle câblé** : `lia/circuit/guarded_cycle.py`

## Liste G01–G17

| Code | Garde-fou | Comportement si fail |
|------|-----------|----------------------|
| G01 | HALT (manuel ou 3 losses) | Bloque tout BUY |
| G02 | COOLDOWN | Attend fin timer |
| G03 | Position déjà ouverte | Max 1 position |
| G04 | Goal 1000 trades | Stop compounding |
| G05 | Pace (min 30 min entre swaps) | Bloque |
| G06 | Cap journalier (8 trades) | Bloque |
| G07 | Asset policy (pas de TRO) | Bloque token |
| G08 | Notional min/max + risk 2 % | Recale / bloque |
| G09 | Profit validated (fees + 1 % net) | Bloque |
| G10 | Liquidité pair min | Bloque |
| G11 | GreenSmoke RISK_OFF | Bloque BUY |
| G12 | Hatom HF < 1.5 | Bloque |
| G13 | Pre-verify on-chain | Bloque live |
| G14 | SL/BE/trailing runtime | Force exit |
| G15 | Post-verify tx | Flag ERROR |
| G16 | Drawdown max 15 % peak | HALT |
| G17 | Veto multi-horizon | Bloque BUY |

## Usage

```python
from lia.circuit.guarded_cycle import run_guarded_cycle

out = run_guarded_cycle(
    market={"token": "WEGLD-bd4d79", "price": 10.0, "liquidity_usd": 100000},
    portfolio={"deployable_usd": 40, "total_usd": 50, "hatom_hf": 3},
    signal={"action": "BUY", "confidence": 0.75},
    profit_validated=True,
    gs={"regime": "NEUTRAL"},
    mode="paper",
)
# out["event"] in OPENED | HOLD | CLOSED | BLOCKED | YIELD | WAIT | ...
# out["preflight"]["blockers"] liste les Gxx en échec
```

## État

- `data/lia_guards_state.json` — compteur journalier + halt manuel
- `data/lia_compound_streak.json` — streak / cooldown / open ticket

## Halt manuel

```python
from lia.circuit.guards import CircuitGuards
CircuitGuards().set_halt("ops intervention")
CircuitGuards().clear_halt()
```

*Neltud — 31 juil 2026*

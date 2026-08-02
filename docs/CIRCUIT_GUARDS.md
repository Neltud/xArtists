# Garde-fous Circuit LIA — Risk Management optimisé

**Module** : `lia/circuit/guards.py` (v2.0.0-risk-opt)  
**Cycle câblé** : `lia/circuit/guarded_cycle.py`  
**Trailing** : `lia/risk/trailing_stop.py`

## Philosophie

1. **Capital first** — hard stops, halt strict, pas de revenge trading
2. **Dynamic sizing** — risk scale selon conf / streak / soft DD / régime
3. **Qualité > quantité** — 6 trades/jour max, pace 20 min, vol filter
4. **Time-stop** — edge +1 % net n’a pas de sens après 4 h
5. **Alignement** CompoundCircuit + StatArb (mêmes SL / BE / trail)

## Liste G01–G20

| Code | Garde-fou | Fail behavior |
|------|-----------|---------------|
| G01 | HALT (manuel ou **2** losses) | Bloque tout BUY |
| G02 | COOLDOWN | Attend fin timer |
| G03 | Position déjà ouverte | Max 1 position |
| G04 | Goal 1000 trades | Stop compounding |
| G05 | Pace (**20 min** min) | Bloque |
| G06 | Cap journalier (**6** trades) | Bloque |
| G07 | Asset policy (pas de TRO) | Bloque token |
| G08 | Notional + **risk dynamique** 1.5 % | Recale / bloque |
| G09 | Profit validated (fees + 1 % net) | Bloque |
| G10 | Liquidité min **$60k** | Bloque |
| G11 | GreenSmoke RISK_OFF | Bloque BUY |
| G12 | Hatom HF < **1.8** | Bloque |
| G13 | Pre-verify on-chain | Bloque live |
| G14 | SL **0.9 %** / BE **0.4 %** / trail **0.35 %** | Force exit |
| G15 | Post-verify tx | Flag ERROR |
| G16 | Drawdown hard **12 %** peak | HALT |
| G17 | Veto multi-horizon | Bloque BUY |
| G18 | **Volatility** ATR > 4 % | Bloque |
| G19 | **Time-stop** hold > 4 h | Force exit |
| G20 | **Soft DD** ≥ 6 % | Réduit risk (scale) |

## Risk scale dynamique

```
scale ∈ [0.50, 1.20]

↓ soft drawdown (6 % → 12 %)
↓ confidence < 0.60
↓ après 1+ perte consécutive
↑ confidence ≥ 0.75 / 0.85
↑ streak wins ≥ 3 / 5
↑ RISK_ON + STATARB
```

`max_notional = deployable × (risk_per_trade × scale) / stop_loss`
plafonné à 20 % du déployable et $350.

## Stops template (G14)

| Niveau | Valeur |
|--------|--------|
| Hard SL | entry × (1 − 0.9 %) |
| Break-even | dès +0.4 % |
| Trailing on | dès +0.6 % |
| Trail distance | 0.35 % sous HWM |
| Time-stop | 4 heures |

## Usage

```python
from lia.circuit.guards import CircuitGuards

g = CircuitGuards()
out = g.preflight(
    token="WEGLD-bd4d79",
    deployable_usd=40,
    liquidity_usd=100_000,
    hours_since_swap=1.0,
    equity_usd=48,
    peak_usd=50,
    confidence=0.82,
    strategy="STATARB",
    atr_pct=0.015,
    gs_regime="NEUTRAL",
    hatom_hf=2.5,
    profit_validated=True,
)
# out["ok"], out["max_notional"], out["risk_scale"], out["blockers"]
```

Runtime (position ouverte) :

```python
act = g.runtime_action(
    entry=10.0, price=10.05, stop=9.91, target=10.22,
    hwm=10.05, trail_active=False, opened_at=opened_ts,
)
# act["action"] in HOLD | STOP_LOSS | TAKE_PROFIT | TIME_STOP
```

## État

- `data/lia_guards_state.json` — compteur journalier + halt manuel
- `data/lia_compound_streak.json` — streak / cooldown / open ticket

## Halt manuel

```python
CircuitGuards().set_halt("ops intervention")
CircuitGuards().clear_halt()
```

---
*LIA v6+ risk-opt — xArtists / MultiversX*

# LIA Dynamic Trailing Stop

**Module :** `lia/risk/trailing_stop.py`

## Modes

| Mode | Comportement |
|------|----------------|
| `percent` | Stop = HWM × (1 − trail_pct) |
| `atr` | Stop = HWM − k×ATR |
| `hybrid` (défaut) | max(distance %, distance ATR), puis resserrement par paliers |

## Fonctionnalités

1. **High-water mark** (long) / low-water mark (short)
2. **Break-even** après `be_trigger_pct` (défaut +1,5 %)
3. **Step tighten** : à 1R / 2R / 3R → trail 6 % → 4 % → 2,5 %
4. **Partial TP** : 50 % à 1R, 25 % à 2R (configurable)
5. **Persist** → `data/lia_trailing_state.json` (dashboard + Vellum)

## Intégration Vellum (chaque cycle prix)

```python
from lia.risk.trailing_stop import DynamicTrailingStopManager

mgr = DynamicTrailingStopManager("data/lia_trailing_state.json")
mgr.load()

# À l'ouverture d'un trade LIA
mgr.open(
    id="t-20260730-001",
    token="TRO-94c925",
    entry=0.000065,
    size_usd=12.5,
    side="LONG",
    atr=0.000002,
    trail_pct=0.08,
    trail_mode="hybrid",
)
mgr.persist()

# À chaque tick / cycle
result = mgr.on_price("t-20260730-001", price=0.000068, atr=0.000002)
# result["action"] in NONE | TIGHTEN | BREAK_EVEN | PARTIAL | STOP
if result["action"] == "STOP":
    # appeler UniversalExecutor pour fermer la position
    pass
mgr.persist()
```

## Paramètres recommandés $TRO (faible liquidité)

| Param | Valeur |
|-------|--------|
| trail_pct initial | 8–12 % |
| atr_mult | 2.0–2.5 |
| be_trigger_pct | 2 % |
| partial 1R | 40–50 % |
| min size | éviter frais (ex. > 8–10 USD) |

## Dashboard

Lire `data/lia_trailing_state.json` : entry, stop, hwm, size_remaining_pct, status.

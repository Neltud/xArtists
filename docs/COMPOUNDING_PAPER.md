# Compounding paper — 10 échelons

## Run
```bash
PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.compounding
```

## Vellum soft step
```python
from lia.compounding.step import run_step
results["compounding"] = run_step()  # never hard-fail
```

## Outputs
- data/compounding_echelons.json
- data/lia_trades.json (last 30, with strategy/fees)

## Front
CompoundingPanel on /trading and optional /compounding

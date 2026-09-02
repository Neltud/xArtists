# Apply critical modules (ops)

`compound_engine.py`, `million_path.py`, and `preflight.py` must not stay as placeholders.

## From repo root

```bash
# Preferred when scripts are on main:
python scripts/apply_compound_and_path.py
python scripts/apply_preflight_stack.py

# Smoke
PYTHONPATH=. python -c "from lia.circuit.compound_engine import CompoundCircuit; from lia.circuit.million_path import compounds_needed; from lia.guardian.preflight import PreFlightValidator; print(compounds_needed(3,1e6,0.01), PreFlightValidator)"

PYTHONPATH=. LIA_LIVE_TRADING=0 python tests/regression/run_all.py
```

## After trade (Vellum)

```python
from lia.circuit.path_executor_hooks import after_trade_close
after_trade_close(net_pnl_usd=5.0, equity_usd=100.0)
```

Artifacts (if scripts missing on remote): `apply_compound_and_path.py`, `apply_preflight_stack.py` in session artifacts.

Keep `LIA_LIVE_TRADING=0` until micro-proof.

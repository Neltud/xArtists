# Exemple `should_skip_micro_trade`

```python
from lia.gas.micro_trade import should_skip_micro_trade, optimize_plan

# Trop petit → SKIP
r = should_skip_micro_trade(
    notional_usd=3.0,
    expected_edge_usd=0.05,
    op="swap_simple",
    egld_usd=25.0,
)
print(r)
# {"skip": True, "reasons": ["notional $3.00 < min $5", ...]}

# Notional OK + edge suffisant → ALLOW (selon fee estimée)
r2 = should_skip_micro_trade(
    notional_usd=50.0,
    expected_edge_usd=2.0,
    op="swap_simple",
    egld_usd=25.0,
    simulated_gas_units=12_000_000,  # optionnel: sortie /transaction/cost
)
print(r2["allow"], r2["gas_limit"], r2["gas_usd"])

# Filtrer une liste de candidats
plan = optimize_plan(
    [
        {"id": "a", "notional_usd": 4, "expected_edge_usd": 0.1},
        {"id": "b", "notional_usd": 40, "expected_edge_usd": 1.5, "op": "swap_simple"},
    ],
    egld_usd=25.0,
)
print(plan["n_kept"], plan["n_dropped"])
```

CLI : `python -m lia.gas.micro_trade`

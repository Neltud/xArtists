# Pyramides compound · Loop Hatom optimisé · Frais AshSwap

## Pyramides (`lia/circuit/compound_pyramids.py`)

Objectif narratif : **~1000 compounds à +1 % net** répartis sur plusieurs sleeves (pas un seul bot all-in).

| Sleeve | % book | Cadence max | Target net |
|--------|--------|-------------|------------|
| MOM | 15 % | 6/jour | +1 % |
| MR | 15 % | 8/jour | +1 % |
| MICRO_ARB | 20 % | **40/jour** | +0,4 % (fees) |
| WEEKLY_SWING | 10 % | **1/semaine** | +2 % |
| YIELD | 25 % | claims | APY continue |
| RESERVE | 15 % | 0 | DEFENSE |

État : `data/lia_compound_pyramids.json`  
Mult. théorique si N compounds à 1 % : `(1.01)^N` (paper).

## Loop Hatom optimisé (`lia/defi/hatom_loop_opt.py`)

- LTV effectif plafonné pour **HF projeté ≥ 2,0**
- Stop si borrow < min notional
- Estimation **net APY** = supply×exposure − borrow×debt − gas
- Bloqué si DEFENSE

## Frais AshSwap (`lia/defi/ashswap_fees.py`)

Modèle conservateur round-trip (pool + agg + gas + slip + buffer).
Compare ashswap / xexchange / onedex → `best_route_cost`.

```bash
python -m lia.circuit.compound_pyramids
python -m lia.defi.hatom_loop_opt
python -m lia.defi.ashswap_fees
```

`LIA_LIVE_TRADING=0` jusqu’à preuve micro.

# Oracles · Micro-proofs · ESDT · Course au million (10 colonnes)

## Oracles (config v2)
`data/oracle_config.json` — MVX multi-source, universe ESDT, deny TRO défaut.

## Micro-proofs
`lia/security/micro_proofs.py` — hash 64hex, user≠LIA ops, notional micro, status success.
Verdict typique avant TX réelles : `INSUFFICIENT_PROOFS`.

## ESDT
`lia/policy/esdt_universe.py` — tout ESDT liquide + oracle ; live = floor liq ; TRO deny.

## 10 colonnes × 1000 trades ~+1%
`lia/circuit/million_columns.py` — C01–C10 stratégies complémentaires (MR/MOM/ARB/YIELD/COMPOUND/DEFENSE/HARVEST).
Math : (1.01)^1000 ≈ 20959× si wins purs ; WR55% allonge fortement le path.

## Tests
```bash
PYTHONPATH=. python lia/circuit/test_million_columns.py
PYTHONPATH=. python lia/security/test_micro_proofs.py
PYTHONPATH=. python -m lia.policy.esdt_universe
```

# Continue ops — état au 2026-08-09

## Vert local (après restore artifacts)

- Regression **76/76**
- `million_path` tests OK
- `preflight` tests OK
- `after_trade_close` → lock adaptatif + next_size

## Sur main déjà

- `docs/MILLION_PATH.md`, `docs/ARCHITECTURE_THREE_CRITICAL.md`
- `lia/circuit/path_executor_hooks.py`
- `lia/risk/profit_lock.py` + `credit_for_equity`
- `lia/board/publish_path.py`, `data/lia_million_path.json`
- UX honesty (PageGuide, ScStatusBanner), SPA `404.html` stubs desk

## À appliquer encore (placeholders sur main)

```bash
# Depuis artifacts de session ou copie manuelle:
cp compound_engine_FIXED.py lia/circuit/compound_engine.py
cp million_path.py lia/circuit/million_path.py
cp preflight.py lia/guardian/preflight.py
# optionnel: guardian_hook, liquidity_orchestrator

PYTHONPATH=. LIA_LIVE_TRADING=0 python tests/regression/run_all.py
```

Scripts gzip (si présents): `scripts/apply_compound_and_path.py`, `scripts/apply_preflight_stack.py`.

## P0 produit

1. Deploy agents-marketplace + nft-marketplace (codeHash ≠ null)
2. Rebuild GH Pages
3. Micro List/Buy wallet **user**
4. `LIA_LIVE_TRADING=0` jusqu’aux micro-preuves + kill-switch drills

## Vellum après chaque trade paper

```python
from lia.circuit.path_executor_hooks import after_trade_close
after_trade_close(net_pnl_usd=..., equity_usd=...)
# LIA_EQUITY_USD=... python -m lia.board.publish_path
```

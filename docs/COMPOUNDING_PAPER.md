# Compounding paper — 10 colonnes · cœur 1% / trade

## Doctrine

| Règle | Valeur |
|-------|--------|
| Colonnes | **10** portefeuilles paper indépendants (E1–E10) |
| Stratégie cœur | **S1 = +1% TP / −0.5% SL** (70% des legs) |
| Satellites | S05 (0.5%), S2 (2%) |
| Trades | **Distincts par colonne** (pair + moment + stream RNG) |
| Max trades produit | **Aucun** — seuls les batchs de simu ont une taille |
| Cible LIA | **1 000 000 USD** (sink USDC) |
| Fees | Round-trip bps + gas déduits |
| Live | `live_trading: false` tant que gates non verts |

## Holders NFT

Partage de performance **sur le dépôt USDC isolé du holder** (escrow par NFT), pas sur le pool LIA protocol.  
Voir `docs/HOLDER_SHARE_MODEL.md`.

## Run
```bash
PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.compounding
```

## Vellum
```python
from lia.compounding.step import run_step
results["compounding"] = run_step({"compounding_legs": 10, "compounding_seed": None})
```
Déjà branché dans `lia/vellum/production_run.py` (phase soft).

## Front
`CompoundingPanel` sur `/trading`.

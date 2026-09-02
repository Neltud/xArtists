# Pools · Hatom · xExchange · OneDex · xMEX

## Catalogue (`lia/defi/placement_catalog.py`)

| Protocol | Placements |
|----------|------------|
| **Hatom** | MM EGLD/USDC lend · borrow · sEGLD/HsEGLD/xEGLD liquid stake · HTM stake |
| **xExchange** | LP · Farm (xMEX) · lock xMEX · unlock MEX |
| **OneDex** | pools = **arb** price source (+ LP optionnel) |
| **AshSwap** | pools + **aggregator** (best swap route) |

## Processus stratégique (ordre)

1. **DEFENSE** → USDC lend / idle  
2. **xMEX weekly** claim + lock (energy) si fenêtre 7j  
3. **Hatom supply** (stable > EGLD), HF ≥ 1.8  
4. **Micro-arb** xEx vs OneDex vs Ash (pas de LP)  
5. **LP+farm** seulement si IL gate OK  
6. **Soul** experimental optionnel  

## xMEX compounding (`lia/defi/xmex_compound.py`)

- Farms → **xMEX** (docs xExchange)  
- Cadence ops **hebdo** : claim → lock (boost) ou unlock → MEX  
- MEX comme collatéral Hatom : **hint only** si marché listé + HF ≥ 2  

## Meilleurs outils LIA

| But | Modules |
|-----|---------|
| Lend | `hatom_routes` + `yield_risk` |
| Loop leverage | `LEVERAGE_LOOP` max 2 + HF≥2 |
| Arb | `micro_arb` + `should_skip_micro_trade` |
| Swap | AshSwap agg hint |
| Rewards | `xmex_compound` |
| Vue globale | `placement_strategy` |

```bash
python -m lia.defi.placement_catalog
python -m lia.defi.xmex_compound
python -m lia.defi.placement_strategy
```

Tout reste **paper** jusqu’à `docs/MICRO_PROOF.md` + SC marketplace deploy.

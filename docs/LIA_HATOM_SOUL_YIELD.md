# Yield risk · Hatom · Soul

## Risk (`lia/defi/yield_risk.py`)

| Risque | Règle |
|--------|--------|
| **HF** | open ≥ 1.8 · maintain ≥ 1.5 · leverage loop ≥ 2.0 |
| **LTV utilisé** | max 50 % de la capacité borrow |
| **Loops** | max **2** (supply→borrow→supply) |
| **IL (LP)** | formule `2√k/(1+k)-1` ; skip si IL estimé > 5 % |
| **DEFENSE** | bloque borrow / leverage |
| **Concentration** | sleeve ≤ 40 % equity ; venue ≤ 60 % |

Lend pure **n’a pas d’IL** ; l’IL s’applique aux **LP** (xExchange).

## Hatom routes (`lia/defi/hatom_routes.py`)

| Action | Description |
|--------|-------------|
| `stake_htm` | Stake HTM |
| `claim_rewards` | Claim rewards |
| `supply_lend` | Supply (lend) |
| `add_collateral` | Supply + enter market |
| `borrow` | Borrow HF-gated |
| `leverage_loop` | Boucles limitées |
| `repay` / `withdraw` | Désendettement |

Plans **paper** jusqu’à ABI + adresses dans `data/contracts.json` → clé `hatom` + `LIA_LIVE_TRADING` micro proof.

## Soul (`lia/defi/soul_routes.py`)

- Couche **cross-chain** (Aave/Morpho/…) — [docs.soul.io](https://docs.soul.io/)
- **Experimental** : supply only, **pas de leverage**, **pas de cross-chain lend** en v1
- Aligné isolation Soul zk dApp (pas de fonds user)

## Vellum

```bash
python -m lia.defi.yield_risk
python -m lia.defi.hatom_routes
python -m lia.defi.soul_routes
python -m lia.circuit.yield_strategy
```

`allow_soul=True` / `prefer_leverage=True` uniquement en paper jusqu’à preuve micro.

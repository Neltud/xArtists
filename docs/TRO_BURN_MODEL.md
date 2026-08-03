# $TRO burn model (optimisé)

## Principe

- **Buyer ne paie pas de surcharge** pour le burn.
- Burn financé par une **part de la fee marketplace** (fee_bps total 300).

## Split fee 300 bps

| Part | bps | Destination |
|------|-----|-------------|
| Treasury LIA | 200 | `accumulated_fees` / claimFees → LIA |
| Burn sleeve | 100 | Buy $TRO on market puis burn, **ou** burn direct si paiement en TRO |

## Chemins

1. **Vente en EGLD (actuel)** : 3 % EGLD en fees ; ops périodique buy&burn TRO avec 1/3 des fees claimées.
2. **Vente en TRO (futur)** : 1 % du price brûlé on-chain dans `buy*`, 2 % treasury.

## SC upgrade (P0 optionnel)

- `burn_bps` storage (default 100)
- Sur buy en TRO token : `ESDTLocalBurn` ou send to burn address
- Tant que non déployé : documenter burn off-cycle dans `data/tro_burn_log.json`

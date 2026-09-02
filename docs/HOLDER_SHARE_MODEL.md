# Holder share — % du dépôt USDC (pas du pool LIA)

## Principe

- Capital user = **escrow isolé par NFT** (`packages/capital-escrow-pack`)
- LIA protocole = 10 colonnes paper/live **séparées** (trésorerie ops)
- Le holder **ne subit pas** les pertes des autres holders
- La rémunération (quand live + policy) est un **% de performance sur SON dépôt**

## Paramètres (defaults product)

| Param | Default | Note |
|-------|---------|------|
| perf_fee_bps | 1000 (10%) | Sur PnL positif du compte escrow |
| high-water | oui (recommandé) | Pas de fee sous HWM |
| plafond dépôt | 10 × prix mint pack | Validator |
| retrait | request + 48h | Capital jamais piégé |

## Formule (conceptuelle)

```
si pnl_period > 0 et equity > high_water:
  fee = pnl_period * (perf_fee_bps / 10_000)
  holder_credit = pnl_period - fee
  # fee → treasury USDC LIA (sink)
```

## Interdit

- Pool partagé multi-users
- Prélever un % sur le dépôt des autres
- Trader le capital holder hors Guardian + Intent + état FUNDED

## Statut

Spec + validator Python. SC escrow + settlement on-chain = après mint agents + codeHash + micro-preuves.

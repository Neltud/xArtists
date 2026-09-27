# SC rewards_pool (draft audit-ready)

**Statut :** draft · **pas de deploy mainnet** avant GO_LIVE + audit.

## Objectif

Recevoir la part **holders** des flux (venue-split, marketplace fee, slot rake) et permettre un **claim** proportionnel à :

1. Valeur LP TRO/* (pools éligibles — oracle / feed off-chain initial, puis on-chain si dispo)
2. ArtPass SFT staked (endpoint stake/unstake séparé ou SC staking existant)

## Règles

- Immuable post-deploy (pas de set_split arbitraire).
- `fund` depuis adresses autorisées (venue-split, marketplace, slot) uniquement.
- Claim user : `claim()` → ESDT / EGLD selon balance accumulée.
- **Paper holder ≠ autorisation** — uniquement LP + ArtPass on-chain.
- Pas de mint TRO.

## Alignement front

`apps/frontend/src/config/treasuryFlows.ts` · `HOLDERS_REWARD_ELIGIBILITY`

## Fichiers

- `src/rewards_pool.rs` — cadre logique + tests split

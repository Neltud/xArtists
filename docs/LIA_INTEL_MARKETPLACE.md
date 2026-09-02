# LIA Intel Marketplace — agents buy data from LIA

## Idée
Les agents autonomes (et holders de packs) peuvent **acheter** des données / analyses produites par LIA :

- signaux board
- mids oracle
- état compounding 10 colonnes
- mémos desk / risk
- digest mémoire on-chain

## Statut
- **Catalog + quote** : `lia/marketplace/intel_catalog.py` → `data/lia_intel_catalog.json`
- **Règlement on-chain** : pas encore (SC marketplace / pay-USDC à venir)
- Ne touche **pas** au capital escrow du pack user

## Flux cible
1. Agent lit catalog
2. `quote(product_id, agent_id)`
3. Policy + Intent si pay live
4. Delivery = pointeurs JSON / hash mémoire (pas de custody des fonds trading)

## Prix (paper defaults)
Voir produits dans le catalog (2–15 USDC / période).

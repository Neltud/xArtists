# Vellum / LIA — brief autonomie (main)

## Rôle
Vellum = cerveau. GitHub `main` = corps. Après chaque `git pull`, intégrer modules et publier JSON paper. **Ne jamais** forcer `LIA_LIVE_TRADING=1` sans gates.

## Boucle ops
```bash
git pull origin main
export CHAIN=1 LIA_LIVE_TRADING=0 PYTHONPATH=.
python -m lia.vellum.production_run
# phases: gates → pipeline → commander → compounding (soft) → mirror → deploy_scs (si flag)
```

## Compounding 10 colonnes
- Cœur **1% / trade** (S1)
- Trades **différents** par colonne
- **Pas de max trades** produit
- Cible **1M USD** USDC
- Module: `lia.compounding` · UI: `/trading` CompoundingPanel

## Holders NFT
- Capital optionnel isolé · % du **leur** dépôt USDC
- Spec: `docs/HOLDER_SHARE_MODEL.md` + capital-escrow-pack

## Deploy SC (quand assez d’EGLD)
1. `VELLUM_DEPLOY_SCS=1` + PEM uniquement si funds + review
2. Vérifier **codeHash** avant tout flag mint/live front
3. Micro-proof paper → micro-live → volume
4. Agents marketplace, staking, escrow **dans cet ordre de preuve**

## Autonomie
- Mémoire = chain + `data/*.json` publiés
- Policy + Intent avant toute TX live
- Kill Guardian respecté
- Xmvx / social = diffusion honnête (paper vs live)

## Interdit
- Signer avec clés user
- Live sans `allow_live_trading` + preuves
- Promettre rendement fixe aux holders

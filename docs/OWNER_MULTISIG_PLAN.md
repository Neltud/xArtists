# Sprint 1.2 — Owner SC : EOA → multisig + timelock

**Statut** : PLAN (pas d’exécution on-chain dans ce livrable)  
**Risque actuel** : tous les SC critiques sondés ont pour owner l’EOA deployer  
`erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`

## Objectif

Séparer **deployer** (qui pousse le code) de **owner** (qui autorise upgrade / change params critiques).

## Cible architecture

| Couche | Rôle |
|--------|------|
| Deployer EOA (CI Environment `production`) | Deploy / upgrade **uniquement** après approval Environment |
| Multisig (2/3 ou 3/5) | Owner on-chain des SC productifs |
| Timelock (24–72 h) | Délai entre proposal d’upgrade et exécution |

## Ordre recommandé (exécution manuelle ultérieure)

1. Déployer / configurer multisig MultiversX (adresses opérateurs documentées)  
2. Déployer timelock (si module dédié) ou procédure manuelle de délai  
3. Pour **chaque** SC critique, `ChangeOwnerAddress` vers multisig  
4. Vérifier via API : `ownerAddress` == multisig  
5. Mettre à jour `data/contracts.json` section `owners`  
6. Rotation : si l’EOA a été exposé hors Environment, régénérer deployer  

## SC prioritaires

1. agents_marketplace  
2. nft_marketplace  
3. treasury_splitter  
4. tro_staking  
5. venue_split  
6. tro_governance  

**Slot** : rester `isPayable=false` — ownership aussi sous multisig, pas de réouverture.

## Interdits

- Ne pas laisser owner = EOA unique en production commerciale  
- Ne pas stocker seed multisig dans GitHub  
- Ne pas changeOwner sans journal (tx hash + date + opérateurs)  

## Critère de sortie 1.2

- [ ] Multisig déployé / adresses listées  
- [ ] Au moins agents + market + treasury sous multisig **ou** plan daté + délai accepté par comité  
- [ ] `data/contracts.json` owners mis à jour  

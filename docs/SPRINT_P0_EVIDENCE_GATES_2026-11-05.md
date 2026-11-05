# Sprint P0 approfondi — 2026-11-05

## Portée et règle de sécurité
Branche de travail isolée après fermeture de toutes les PR ouvertes. **Ne pas fusionner, déployer, lancer un mint, envoyer une transaction ou initier un paiement.** Les 20 issues initialement ouvertes restent ouvertes jusqu'à preuves indépendantes et critères d'acceptation satisfaits.

## Livraison 1 : contrôle des preuves, hors chaîne
- `services/access-api/src/p0ReleaseGates.mjs` : évaluation pure des preuves attendues pour #281, #402, #370 et #403 ; un hash SHA-256, un relecteur et un horodatage ne constituent **pas** en eux-mêmes une preuve que la source est authentique. L'évaluateur ne consulte ni la production ni la blockchain.
- `services/access-api/tests/p0ReleaseGates.test.mjs` : quatre tests unitaires créés, non exécutés à ce stade.
- Sortie `commercial_go: false` même quand le dossier documentaire est complet. Aucune API d'activation, aucune mutation de commande.

## Plan d'exécution et critères de sortie
| Priorité | Issue | Travaux nécessaires | Condition de fermeture |
| --- | --- | --- | --- |
| P0 | #281 | Contrôle DSN de production autorisé, transactions SQL atomiques multi-workers, rapprochement IPN S1 / NFT S2, remboursement | Livraison NFT réellement prouvée, tests et recette indépendants |
| P0 | #402 | OAuth/stockage sécurisé, SHA-256 des octets, deux fournisseurs IPFS indépendants, restauration, droits | Deux répliques relues et sauvegarde restaurée, preuves documentées |
| P0 | #370 | Séparer adaptateurs EUR et EGLD, mandat durable, anti-rejeu, récupération des résultats inconnus | Tests PSP/chaîne corrélés et audit sécurité, sans faux `delivered` |
| P0 | #403 | Vérifier opérateur du minter Pulse, médias et CIDs, transaction spécifique signée par détenteur | NFT réel vérifié sur chaîne et propriété du destinataire, après autorisation |

## Dépendances et non-acquis
- #403 dépend de #402 et #281 ; #370 dépend aussi du ledger de mandat et des preuves de livraison.
- Les PR #406 et #404 sont fermées, non fusionnées : leur code n'est **pas** présent dans `main` ni dans cette branche.
- Les tests locaux/CI, le comportement de production, la vérification des wallets et l'existence de CIDs restent **non vérifiés**.
- Ne fermer aucune issue simplement parce qu'un test unitaire ou un rapport de préparation existe.

## Prochaine itération
Exécuter les tests sur un environnement isolé, inspecter les états réels du backend autorisé en lecture seule, puis cibler une correction testable du cycle `paid → mint_pending → verified_delivery` sans activer de paiement ni de mint.

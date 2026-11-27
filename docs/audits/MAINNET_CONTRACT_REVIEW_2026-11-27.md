# Mainnet — revue ciblée du 27 novembre 2026

## Périmètre et preuves
Lecture du registre apps/frontend/src/config/contracts.ts et des réponses publiques GET https://api.multiversx.com/accounts/{address}. Dix adresses sur dix contiennent du code et correspondent exactement au codeHash enregistré. Les dix réponses indiquent isUpgradeable=true. Aucun envoi de transaction, aucun changement de permission, aucune preuve de compilation reproductible source→bytecode dans cette revue.

| Contrat | CodeHash | isPayable | État de validation |
|---|---|---|---|
| nft_marketplace | conforme | true | achat historique #2 et livraison attestés ; nouveau dépôt utilisateur à vérifier |
| agents_marketplace | conforme | false | buyPack crée une liste URI vide dans la source ; commercialisation non validée |
| venue_split | conforme | false | rentPay/rentPayEsdt et destinataires à vérifier |
| nft_staking | conforme | false | allowlist, garde et récupération à vérifier |
| tro_staking | conforme | false | identité TRO, dépôt et retrait à vérifier |
| tro_staking_legacy | conforme | false | historique, ne pas rediriger les nouveaux dépôts |
| tro_governance | conforme | false | blocages DAO ci-dessous |
| agent_stake_escrow | conforme | false | dépôt et remboursement à vérifier |
| treasury_splitter | conforme | false | destinations, configuration et répartition à vérifier |
| slot_casino | conforme | false | hors ouverture commerciale de ce lot |

isPayable concerne notamment les transferts directs, ne suffit pas à conclure au comportement des endpoints payable. La conformité du codeHash ne démontre ni l'absence de vulnérabilité ni les droits d'exploitation. Vérifier propriétaire de la chaîne, propriétaire applicatif et capacité d'upgrade distinctement ; renoncer au propriétaire interne n'établit pas l'immuabilité du compte.

## Constats de revue source (à confirmer par build reproductible et état du contrat)
- P0 DAO (contracts/tro-governance/src/lib.rs) : si artpass_token est vide, le premier stakeArtPass choisit la collection. Initialisation/validation explicite nécessaire. La collection effectivement enregistrée n'est pas attestée ici.
- P0 DAO : vote lit la puissance courante, unstakeArtPass n'impose pas de verrou par proposition. Possibilité de réutiliser le même stake entre comptes ; prévoir une migration, verrou ou snapshot, tests multi-comptes et règles de quorum. L'owner peut modifier lp_weight et clôturer avant terme. Ne pas annoncer une DAO trustless.
- P1 garde : unstake NFT/TRO/ArtPass et closeStake exigent !paused. Une pause peut empêcher une sortie. Revoir la politique et les cas de récupération avant nouveaux dépôts.
- P1 packs : buyPack construit un ManagedVec d'URI vide ; ne pas assimiler émission à livraison d'un produit exploitable. Vérifier rôles ESDT et métadonnées, prix, bénéficiaires, droits.
- P1 treasury/venue : les bénéficiaires sont des paramètres critiques ; splitter permet des changements par owner. Vérifier les destinations réelles et les montants avant tout envoi.
- P1 marché : #642 retire le plafond de 12 identifiants et ajoute la preuve du dépôt. Le contrat est historiquement utilisé, sans stock au dernier contrôle. Frais/royalties cumulés <=10% et validation individuelle à conserver.

## Correctifs de ce lot
runtimeCodehash.ts : cache mémoire uniquement ; invalider les observations au début de la nouvelle vérification ; identité exacte du compte et code non vide ; timeout ; fingerprint obligatoire ; rejet des dates futures ; copie des snapshots. Tests exécutant le véritable module (et non une réimplémentation du cache). Page de statut : distinguer achat/dépôt NFT individuel du commerce général et observations xOrus du paper.
Le contrôle frontend n'est pas une barrière de sécurité du contrat.

## Solana
Le registre config/solanaPrograms.ts contient null en mainnet et devnet pour les deux programmes. Les IDs localnet ne sont pas des clés de déploiement. Revue des interfaces Anchor/PDA effectuée, pas de certification complète. Obtenir des IDs contrôlés, vérifier binaires, autorités, comptes de marché/DAO, standards NFT et royalties, réaliser les preuves de cycle de vie avant activation. Aucun mint TRO SPL attesté.

## Conclusion
Ce rapport est une revue ciblée, pas un audit indépendant exhaustif. Les fonds et les garde-fous existants sont inchangés. Ne pas activer globalement VITE_*_CODEHASH_OK, packs, bridge, staking, gouvernance, jeu d'argent ou trading sur la seule base de ce rapport. Priorité au parcours NFT signé, puis aux corrections de contrats et preuves de récupération. Toute mise à jour on-chain nécessite une transaction signée par l'autorité compétente.

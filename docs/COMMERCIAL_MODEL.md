---
hidden: false
---

# Modèle commercial xArtists — état de lancement (10 novembre 2026)

**La préparation commerciale est autorisée ; les paiements, ventes Genesis et mint restent NO-GO.**
Ce document remplace les anciennes consignes du 2 novembre parfois interprétées comme une autorisation de mint live. Ni une variable d'environnement, ni une PR fusionnée, ni un contrat déployé, ni un produit Stripe actif ne prouvent la capacité de livrer un NFT.

Le [dossier de préparation et de certification par rail](ops/COMMERCIAL_LAUNCH_PREP_2026-11-10.md) prévaut pour l'ordre de recette ; chaque activation nécessite ensuite ses propres preuves et autorisations datées.

## Deux familles commerciales, sans mélange de droits

| Offre | Modèle prévu | Moyen de paiement prévu | Actif / prestation | Statut |
|---|---|---|---|---|
| Genesis Pulse, Yield, Sentinel | Achat unique NFT | **EGLD par wallet MultiversX vérifié**, après devis et signature | NFT de collection + droits propres au pack après preuve de livraison | **Vente suspendue** |
| Abonnement xArtists / TCA | Mensuel ou annuel, prix et PSP à approuver | **Fiat EUR via prestataire hébergé** | Services actifs pendant l'abonnement, **aucun NFT Genesis** | **Abonnement production non certifié** |
| Plugin XA World Rights | Licence / service à définir après revue des droits | Aucun checkout autorisé actuellement | Licence logicielle et droits d'usage à définir ; exemption propriétaire uniquement avec wallet prouvé | **Licence et vente bloquées** |

**Un visiteur sans wallet** peut découvrir la dApp et, après livraison d'une vraie authentification serveur, gérer un abonnement fiat sans popup crypto. Une personne voulant acheter un NFT EGLD devra associer et prouver le wallet qui signe ; aucun compte par simple saisie d'adresse ne peut signer ou prouver une propriété.

## Prix de catalogue et réalité du contrat — distincts

| Pack | Catalogue indicatif en EUR | Observation getPackPrice du 08/11/2026 |
|---|---:|---:|
| Pulse | 110 € | 1 EGLD |
| Yield | 75 € | 5 EGLD |
| Sentinel | 50 € | 2,5 EGLD |

Collections de référence : XAIPLS-2cf72b, XAIYLD-987e24 et XAISNT-3d8a6b ; plafonds historiquement annoncés : 333 / 500 / 777.

- Les prix **33 / 22,5 / 15 EGLD** figurant dans un ancien tableau Rule 1 sont **obsolètes et incompatibles** avec l'observation on-chain datée. Ils ne sont ni tarifs approuvés ni montants envoyables au wallet.
- Les **1 / 5 / 2,5 EGLD** du 8 novembre ne sont **pas** davantage un devis valide aujourd'hui : un prix commercial doit être approuvé puis rapproché d'une réponse VM récente, exacte en unités atomiques, du bon contrat/réseau.
- Les montants EUR sont un **catalogue d'information**, pas une conversion automatique en EGLD ni l'autorisation de vendre ces packs en fiat.
- Les six NFT Genesis déjà observés avec URI média vide restent un blocage de livraison. Un achat confirmé sans médias ni droits vérifiés ne doit jamais être présenté comme livré.
- Voir [preuve du garde-fou prix EGLD](ops/PACK_MAINNET_PRICE_GATE_2026-11-09.md) et [preuve on-chain datée](ops/AGENTS_PACK_PRICE_MATRIX_2026-11-08.json).

## Fiat : abonnements services uniquement

Les montants **29 €/mois** et **290 €/an** de l'ancienne [spécification TCA](WHOP_TCA_MEMBERSHIP.md) sont des **cibles historiques non approuvées dans ce dossier**. Aucun produit récurrent ni TVA ne peut être supposé configuré.

Une inspection en lecture seule du compte Stripe de production connecté le 10 novembre a identifié **trois produits Genesis actifs à prix unique (110 €, 75 €, 50 €), sans prix récurrent dans la liste retournée**. Cela ne prouve aucun paiement effectif, lien de checkout ou souscription. **Ne pas activer ces produits dans la dApp comme moyen alternatif d'achat NFT.** Toute décision d'archivage, de conversion de catalogue ou de création de produits d'abonnement est une opération marchande distincte soumise à l'approbation du titulaire du compte.

Stripe et Whop ne doivent pas être présentés comme deux rails live interchangeables. Il reste à décider explicitement le prestataire de l'abonnement fiat, le plan, le prix TTC/HT, la TVA, la politique de résiliation et le support ; ensuite seulement tests sandbox, webhook signé, commandes idempotentes, événements de remboursement, droits actifs/révoqués et recette de production.

Un abonnement ne déclenche **jamais** mint-on-payment Genesis. Une redirection PSP de succès ne valide jamais l'accès sans preuve du serveur.

## Aucun mint automatique autorisé

La mention historique **« Operator GO 2026-11-02 : live_mint=true »** est **révoquée comme consigne opérationnelle** par l'état plus récent : checkout et dispatch restent fermés jusqu'à certification G01–G14 et preuve réelle du bénéficiaire. Les anciens workflows et variables ne sont pas des autorisations permanentes.

Le pilote Pulse #005 est un mint **non commercial**, avec médias IPFS définitifs, droits attestés, contrat/rôles vérifiés et **signature wallet distincte après revue** ; sa PR reste [#407](https://github.com/Neltud/xArtists/pull/407). Il ne débloque aucune vente de pack.

Les marketplaces EGLD, OpenSea Polygon/Solana, RWA, DAO on-chain, trading LIA et bridges demandent des décisions indépendantes. Toutes les routes peuvent rester visibles avec un statut exact **Découverte / Préparation / Indisponible**.

## Règle de publication

Les documents de présentation, le thème clair, le musée, les données explicitement datées et les offres non transactionnelles peuvent être publiés selon recette de build/UX. **Aucun flag de vente, grant, mint, escrow, paiement ou trading ne doit être changé** sur la base de ce document.

Références : [critères de lancement](security/launch-gates.md) · [dossier des opérations](ops/COMMERCIAL_LAUNCH_PREP_2026-11-10.md) · [blocage livraison #281](https://github.com/Neltud/xArtists/issues/281) · [comptes wallet/sans wallet #465](https://github.com/Neltud/xArtists/issues/465) · [licence #416](https://github.com/Neltud/xArtists/issues/416).

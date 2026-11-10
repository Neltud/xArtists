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
| Abonnement mainstream xArtists (3 niveaux) | **Mensuel** | **Stripe Nelsonprods retenu comme PSP cible**, sandbox uniquement | Services actifs pendant l'abonnement, **aucun NFT Genesis** ; accessible sans wallet après identité vérifiée | **Abonnement production non certifié** |
| Plugin XA World Rights | Licence / service à définir après revue des droits | Aucun checkout autorisé actuellement | Licence logicielle et droits d'usage à définir ; exemption propriétaire uniquement avec wallet prouvé | **Licence et vente bloquées** |

**Un visiteur sans wallet** peut découvrir la dApp et, après livraison d'une vraie authentification serveur, gérer un abonnement fiat sans popup crypto. Une personne voulant acheter un NFT EGLD devra associer et prouver le wallet qui signe ; aucun compte par simple saisie d'adresse ne peut signer ou prouver une propriété.

## Prix de catalogue et réalité du contrat — distincts

| Pack | **Prix commercial cible confirmé le 10/11/2026** | Dernière observation contrat datée du 08/11/2026 | Décision |
|---|---:|---:|---|
| Pulse | **33 EGLD** | 1 EGLD | **NO-GO : écart à résoudre** |
| Yield | **22 EGLD** | 5 EGLD | **NO-GO : écart à résoudre** |
| Sentinel | **11 EGLD** | 2,5 EGLD | **NO-GO : écart à résoudre** |

Collections de référence : XAIPLS-2cf72b, XAIYLD-987e24 et XAISNT-3d8a6b ; plafonds historiquement annoncés : 333 / 500 / 777.

- Les prix **33 / 22 / 11 EGLD** sont désormais les **objectifs tarifaires choisis par le propriétaire**, et non des valeurs lues sur le contrat. Les anciennes variantes **33 / 22,5 / 15 EGLD** sont remplacées. Ne pas modifier les prix on-chain, proposer une signature ni ouvrir l'achat avant une **autorisation technique spécifique** et une preuve VM récente du contrat réel.
- Les **1 / 5 / 2,5 EGLD** du 8 novembre ne sont **pas** davantage un devis valide aujourd'hui : un prix commercial doit être approuvé puis rapproché d'une réponse VM récente, exacte en unités atomiques, du bon contrat/réseau.
- Les anciens montants Genesis **110 / 75 / 50 EUR** ne sont pas des prix fiat actuellement autorisés pour les NFT. Les abonnements EUR ci-dessous n'ont aucun droit NFT ; aucun achat de pack par carte n'est autorisé dans ce lot.
- Les six NFT Genesis déjà observés avec URI média vide restent un blocage de livraison. Un achat confirmé sans médias ni droits vérifiés ne doit jamais être présenté comme livré.
- Voir [preuve du garde-fou prix EGLD](ops/PACK_MAINNET_PRICE_GATE_2026-11-09.md) et [preuve on-chain datée](ops/AGENTS_PACK_PRICE_MATRIX_2026-11-08.json).

## Fiat : abonnements services uniquement

Le propriétaire a retenu trois montants mensuels mainstream le 10/11/2026 : **3,79 €**, **5,79 €**, **9,79 €** par mois. Niveaux techniques proposés : `fiat_379`, `fiat_579`, `fiat_979` (noms publics, services inclus, fiscalité TTC/HT, essais, remises et CGV restant à approuver). Aucun des trois n'inclut de NFT, mint, accès aux packs ou actif numérique. Les **29 €/mois et 290 €/an** dans l'ancienne [spécification TCA](WHOP_TCA_MEMBERSHIP.md) sont désormais des **valeurs historiques non retenues**.

Une inspection en lecture seule du compte Stripe de production connecté le 10 novembre a identifié **trois produits Genesis actifs à prix unique (110 €, 75 €, 50 €), sans prix récurrent dans la liste retournée**. Cela ne prouve aucun paiement effectif, lien de checkout ou souscription. **Ne pas activer ces produits dans la dApp comme moyen alternatif d'achat NFT.** Toute décision d'archivage, de conversion de catalogue ou de création de produits d'abonnement est une opération marchande distincte soumise à l'approbation du titulaire du compte.

**Prestataire choisi : Stripe Nelsonprods** pour les abonnements EUR, **préparation et tests hors ligne/sandbox uniquement**. Ne créer ni produit, ni Price, ni Checkout Session, ni abonnement et ne rien activer avant validation séparée. PayBox est un candidat pour une autre voie carte si ses capacités de récurrence et ses contrats le permettent ; MoonPay est une rampe d'accès EGLD, pas une preuve de paiement d'abonnement ; **Finance Computer est à qualifier**, sans partenariat ni API présumés (le mail de Martin n'a pas été retrouvé dans la boîte actuellement connectée). Le cas échéant, chacun exige une approbation, une chaîne de preuves et une réconciliation distinctes. Confirmer TTC/HT, TVA, résiliation, CGV et support avant tout encaissement.

Un abonnement ne déclenche **jamais** mint-on-payment Genesis. Une redirection PSP de succès ne valide jamais l'accès sans preuve du serveur.

## Aucun mint automatique autorisé

La mention historique **« Operator GO 2026-11-02 : live_mint=true »** est **révoquée comme consigne opérationnelle** par l'état plus récent : checkout et dispatch restent fermés jusqu'à certification G01–G14 et preuve réelle du bénéficiaire. Les anciens workflows et variables ne sont pas des autorisations permanentes.

Le pilote Pulse #005 est un mint **non commercial**, avec médias IPFS définitifs, droits attestés, contrat/rôles vérifiés et **signature wallet distincte après revue** ; sa PR reste [#407](https://github.com/Neltud/xArtists/pull/407). Il ne débloque aucune vente de pack.

Les marketplaces EGLD, OpenSea Polygon/Solana, RWA, DAO on-chain, trading LIA et bridges demandent des décisions indépendantes. Toutes les routes peuvent rester visibles avec un statut exact **Découverte / Préparation / Indisponible**.

## Règle de publication

Les documents de présentation, le thème clair, le musée, les données explicitement datées et les offres non transactionnelles peuvent être publiés selon recette de build/UX. **Aucun flag de vente, grant, mint, escrow, paiement ou trading ne doit être changé** sur la base de ce document.

Références : [critères de lancement](security/launch-gates.md) · [dossier des opérations](ops/COMMERCIAL_LAUNCH_PREP_2026-11-10.md) · [blocage livraison #281](https://github.com/Neltud/xArtists/issues/281) · [comptes wallet/sans wallet #465](https://github.com/Neltud/xArtists/issues/465) · [licence #416](https://github.com/Neltud/xArtists/issues/416).

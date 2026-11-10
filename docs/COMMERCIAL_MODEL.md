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
| Genesis Pulse, Yield, Sentinel | Achat unique NFT | **EGLD par wallet MultiversX vérifié**, devis à la signature | NFT de collection + droits propres au pack après preuve de livraison | **Vente suspendue** |
| Abonnement mainstream xArtists (3 niveaux) | **Mensuel, prix TTC** | **Stripe Nelsonprods retenu comme PSP cible**, sandbox uniquement | Services actifs pendant l'abonnement, **aucun NFT Genesis** ; accessible sans wallet après identité vérifiée | **Abonnement production non certifié** |
| Plugin XA World Rights | Licence / service à définir après revue des droits | Aucun checkout autorisé actuellement | Licence logicielle et droits d'usage à définir ; exemption propriétaire uniquement avec wallet prouvé | **Licence et vente bloquées** |

**Un visiteur sans wallet** peut découvrir la dApp et, après livraison d'une vraie authentification serveur, gérer un abonnement fiat sans popup crypto. Une personne voulant acheter un NFT EGLD devra associer et prouver le wallet qui signe ; aucun compte par simple saisie d'adresse ne peut signer ou prouver une propriété.

## Prix de catalogue et réalité du contrat — distincts

| Pack | **Cible propriétaire** | Dernière observation contrat datée du 08/11/2026 | Décision |
|---|---:|---:|---|
| Pulse | **33 EGLD** plafond de devis | 1 EGLD | **NO-GO : pas de prix figé, pas d'achat** |
| Yield | **22 EGLD** plafond de devis | 5 EGLD | **NO-GO : pas de prix figé, pas d'achat** |
| Sentinel | **11 EGLD** plafond de devis | 2,5 EGLD | **NO-GO : pas de prix figé, pas d'achat** |

Collections de référence : XAIPLS-2cf72b, XAIYLD-987e24 et XAISNT-3d8a6b ; plafonds historiquement annoncés : 333 / 500 / 777.

### Politique EGLD n°2 — devis à la signature (10/11/2026, 18:11 Europe/Paris)

Le propriétaire a choisi la **politique 2**, pas un `setPackPrice` permanent.

- Aucune écriture on-chain de 33 / 22 / 11 EGLD n'est autorisée par cette décision.
- Au moment où une signature sera un jour demandée : un seul montant atomique EGLD, taux frais, **TTL 180 secondes**, affiché avant signature. L'acheteur signe ce montant, rien d'autre.
- 33 / 22 / 11 EGLD sont le **plafond** du devis. Un devis au-dessus est refusé. Ils ne sont pas le prix stocké dans le contrat.
- Les anciens **110 / 75 / 50 EUR** ne redeviennent pas la base de conversion. Aucune autre base EUR Genesis n'a été nommée. Sans cette base, le devis ne se calcule pas : le rail NFT reste **NO-GO**.
- L'euro affiché à côté d'un montant EGLD, le jour où un devis existera, est indicatif. Ce n'est pas un second prix, et ce n'est pas le TTC des abonnements.
- Le relevé contrat **1 / 5 / 2,5 EGLD** du 8 novembre n'est pas un devis.

- Les six NFT Genesis déjà observés avec URI média vide restent un blocage de livraison. Un achat confirmé sans médias ni droits vérifiés ne doit jamais être présenté comme livré.
- Voir [preuve du garde-fou prix EGLD](ops/PACK_MAINNET_PRICE_GATE_2026-11-09.md) et [preuve on-chain datée](ops/AGENTS_PACK_PRICE_MATRIX_2026-11-08.json).

## Fiat : abonnements services uniquement

Le propriétaire a retenu trois montants mensuels mainstream, confirmés **TTC** le 10/11/2026 à 18:11 Europe/Paris : **3,79 € TTC**, **5,79 € TTC**, **9,79 € TTC** par mois. Niveaux techniques : `fiat_379`, `fiat_579`, `fiat_979`. Noms publics, périmètre de services, taux de TVA, essais, remises et CGV restent à approuver. **TTC n'autorise ni produit Stripe, ni Price, ni Checkout Session.** Aucun des trois n'inclut de NFT, mint, accès aux packs ou actif numérique. Les **29 €/mois et 290 €/an** dans l'ancienne [spécification TCA](WHOP_TCA_MEMBERSHIP.md) sont des **valeurs historiques non retenues**.

Une inspection en lecture seule du compte Stripe de production connecté le 10 novembre a identifié **trois produits Genesis actifs à prix unique (110 €, 75 €, 50 €), sans prix récurrent dans la liste retournée**. Cela ne prouve aucun paiement effectif, lien de checkout ou souscription. **Ne pas activer ces produits dans la dApp comme moyen alternatif d'achat NFT.** Toute décision d'archivage, de conversion de catalogue ou de création de produits d'abonnement est une opération marchande distincte soumise à l'approbation du titulaire du compte.

**Prestataire choisi : Stripe Nelsonprods** pour les abonnements EUR, **préparation et tests hors ligne/sandbox uniquement**. Ne créer ni produit, ni Price, ni Checkout Session, ni abonnement et ne rien activer avant validation séparée. L'API Render publique du 10/11 répond `stripe_configured=false`. PayBox est un candidat pour une autre voie carte si ses capacités de récurrence et ses contrats le permettent ; MoonPay est une rampe d'accès EGLD, pas une preuve de paiement d'abonnement ; **Finance Computer** présente publiquement une offre d'API en marque blanche (comptes, cartes, paiements, conversion) articulée autour de **xMoney / MultiversX** sur https://www.financecomputer.com ; cette description fournisseur ne constitue **ni accord xArtists, ni accès sandbox API, ni autorisation de traiter des fonds**. Le mail de Martin n'a pas été retrouvé dans la boîte Gmail actuellement connectée : périmètre contractuel et interlocuteur à confirmer. Le taux de TVA, la résiliation, les CGV et le support restent à trancher avant tout encaissement. Les prix, eux, sont TTC.

Un abonnement ne déclenche **jamais** mint-on-payment Genesis. Une redirection PSP de succès ne valide jamais l'accès sans preuve du serveur.

## Aucun mint automatique autorisé

La mention historique **« Operator GO 2026-11-02 : live_mint=true »** est **révoquée comme consigne opérationnelle** par l'état plus récent : checkout et dispatch restent fermés jusqu'à certification G01–G14 et preuve réelle du bénéficiaire. Les anciens workflows et variables ne sont pas des autorisations permanentes.

Le pilote Pulse #005 est un mint **non commercial**, avec médias IPFS définitifs, droits attestés, contrat/rôles vérifiés et **signature wallet distincte après revue** ; sa PR reste [#407](https://github.com/Neltud/xArtists/pull/407). Il ne débloque aucune vente de pack.

Les marketplaces EGLD, OpenSea Polygon/Solana, RWA, DAO on-chain, trading LIA et bridges demandent des décisions indépendantes. Toutes les routes peuvent rester visibles avec un statut exact **Découverte / Préparation / Indisponible**.

## dApp publique déjà servie

Le 10/11/2026 à 18:12 Europe/Paris, `https://neltud.github.io/xArtists/` répond **HTTP 200**, titre « xArtists — L’art dans une autre dimension », assets JS/CSS **HTTP 200**. `Last-Modified` de l'index : **9 novembre 2026, 22:07 UTC**. Ce build est le site de découverte. Il n'est pas un GO commercial. `xartists.art` et `www.xartists.art` **ne résolvent pas** (pas d'enregistrement DNS depuis ce contrôle).

## Règle de publication

Les documents de présentation, le thème clair, le musée, les données explicitement datées et les offres non transactionnelles peuvent être publiés selon recette de build/UX. **Aucun flag de vente, grant, mint, escrow, paiement ou trading ne doit être changé** sur la base de ce document.

Références : [critères de lancement](security/launch-gates.md) · [dossier des opérations](ops/COMMERCIAL_LAUNCH_PREP_2026-11-10.md) · [blocage livraison #281](https://github.com/Neltud/xArtists/issues/281) · [comptes wallet/sans wallet #465](https://github.com/Neltud/xArtists/issues/465) · [licence #416](https://github.com/Neltud/xArtists/issues/416).

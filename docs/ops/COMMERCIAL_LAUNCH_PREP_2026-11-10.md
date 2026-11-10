---
description: >-
  Préparation auditée du lancement commercial xArtists, sans activation des rails.
---

# xArtists — dossier de préparation commerciale (10 novembre 2026)

**Décision du propriétaire dans la conversation du 10/11 : GO pour préparer le lancement complet ; aucun GO financier ou on-chain.**
Les six validations de catégorie (site public, prix, wallets, IPFS/PostgreSQL, publication artistique #005, paiements/domaine/licences) autorisent le **travail préparatoire**. Elles **ne remplacent pas** des conditions commerciales chiffrées, une vérification cryptographique, une licence finalisée, un avis juridique, une preuve d'infrastructure ou une signature wallet.

**Règle non négociable : chaque rail est NO-GO tant que son propre dossier de preuves et sa décision humaine signée/datée ne sont pas complets.** Le site public en découverte peut rester accessible. Ce fichier n'est ni un flag runtime ni une source d'autorisation pour un agent, un backend ou GitHub Actions.

## Point de contrôle et provenance

- Revue de dépôt GitHub connecté le 10/11/2026 ; référence de départ main : dcdd641bed8f75d5cec7b6c443956385c889afb3 (bot shadow tick), à recontrôler au merge et au déploiement.
- Inventaire de départ : 9 PR ouvertes, 11 issues ouvertes. Aucune CI de la nouvelle branche n'est présumée verte.
- Deux projets Neon **sandbox** identifiés ; aucune preuve que la DATABASE_URL de Render pointe sur l'un d'eux ou sur une base de production dédiée. Ne pas partager les chaînes de connexion.
- Compte Stripe en mode production accessible : trois produits Genesis **one-time** affichés actifs, de 110 / 75 / 50 EUR ; ce constat n'atteste **aucun checkout ni abonnement actif**. Le modèle retenu par le propriétaire demande **EGLD signé pour l'achat NFT** et **fiat EUR sous abonnement pour les services**. Ne pas réutiliser ces produits Stripe one-time pour contourner cette règle ; revue/archivage à arbitrer explicitement, sans mutation dans cette préparation.
- Render : workspace trouvé ; **déploiement courant, identité de base, configuration effective et disponibilité HTTP non certifiés dans cette revue**.
- Source d'observation on-chain datée du 08/11 : Pulse 1 EGLD, Yield 5 EGLD, Sentinel 2,5 EGLD ; **ce ne sont pas des devis live**. Le propriétaire fixe maintenant comme **objectifs** 33 / 22 / 11 EGLD, mais les contrats ne sont pas alignés. Les 110 / 75 / 50 EUR sont un ancien catalogue one-time, pas une parité EGLD ni une offre NFT fiat activable.

## Actualisation des choix du propriétaire — 10 novembre 2026

**Paramètres de préparation confirmés ; aucune autorisation de prélèvement ou de transaction.**

| Famille | Offres et cibles commerciales | PSP / voie prévue | Preuve bloquante |
|---|---|---|---|
| **NFT Genesis** | Pulse **33 EGLD**, Yield **22 EGLD**, Sentinel **11 EGLD**, achat unique | Wallet MultiversX et EGLD, signature distincte | VM readback du 08/11 : **1 / 5 / 2,5 EGLD** seulement ; prix cible ≠ contrat. Mise en cohérence du contrat, revue et autorisation dédiées **avant tout achat** |
| **Fiat mainstream, sans NFT** | **3,79 €**, **5,79 €**, **9,79 € par mois** ; SKU internes `fiat_379`, `fiat_579`, `fiat_979` | **Stripe Nelsonprods choisi**, configuration et preuves sandbox seulement, **aucune session payante** | Produits/prix récurrents non créés dans ce lot ; vérification e-mail/OIDC, mapping client, factures payées signées, période, refund/révocation et DB exigés |
| **MoonPay** | Acquisition d'EGLD par l'utilisateur, hors abonnement | Rampe crypto distincte | Acheter de l'EGLD ne prouve ni achat NFT, ni droit de service |
| **PayBox** | Option carte à évaluer indépendamment | Contrat/PSP distinct de Stripe, aucun abonnement supposé | Récurrence, IPN et durabilité juridique/technique à certifier par rail |
| **Finance Computer** | **Qualification uniquement** | Rôle à préciser avec Martin, **aucun partenariat ni intégration présumés** | Mail/contrat/API non vérifiés dans la boîte Gmail connectée ; aucun badge ni checkout |
 
Le propriétaire s'occupe personnellement du domaine `xartists.art`, à recontrôler après correction du registraire. Les montants EUR ne sont pas qualifiés TTC ou HT ; TVA, CGV, services inclus, essais et résiliation restent à arbitrer. Les anciens tarifs `29 €/mois`, `290 €/an`, `33 / 22,5 / 15 EGLD` et l'ancien catalogue Genesis en EUR ne doivent pas alimenter un checkout.

## Matrice des capacités — aucune opération transactionnelle ouverte

| Parcours / rail | Utilisable maintenant | Preuves minimales avant GO financier / NFT | Travaux | Autorité finale |
|---|---|---|---|---|
| Visiteur public sans wallet, musée, œuvres, catalogue, navigation | Découverte selon build public | SHA déployé, mobile, liens, accessibilité, états off, consentements | #348 #393, PR release #466 | Mainteneur pour publication uniquement |
| Compte sans wallet et compte avec wallet vérifié | **Pas d'auth production certifiée** | Identité serveur stable, email vérifié, SIWX nonce anti-replay lié au domaine/chain, session et suppression/exports, tests hostiles | #465 | Responsable produit + revue sécurité |
| Abonnement fiat EUR pour services, sans NFT | **NO-GO** | Prestataire explicitement sélectionné, produit récurrent et prix approuvés, conditions/TVA, checkout hébergé, webhook signé, subscription durable, accès actif/revoqué, retries/refund/cancel, preuve PSP réelle ; identité backend | #465 #281 #416 | Titulaire du compte PSP + sécurité |
| Genesis Pulse / Yield / Sentinel : achat EGLD wallet signé | **NO-GO** | Prix commercial EGLD approuvé puis devis atomique frais, SC/codehash/chainId 1 et rôles, média/CID réel, wallet utilisateur, transaction finale, NFT reçu et droits effectifs, anti-replay/refund | #281 #428, docs/ops/PACK_MAINNET_PRICE_GATE_2026-11-09.md | Owner contrats + signataire acheteur + sécurité |
| Studio : upload média IPFS et 3D GLB | **NO-GO upload public** | Projet DB lié à Render identifié, migrations/quotas/permissions, JWT Pinata serveur, pin et récupération exact-byte SHA256, sauvegarde indépendante, récupération, rights clearance, mobile | #403 #281, docs/ops/STUDIO_GLB_IPFS_UPLOAD_GATE_2026-11-08.md | Owner infra + artiste |
| Genesis Pulse #005 : mint owner-only non commercial | **NO-GO mint** | Quatre objets exacts (recto, verso, animation, JSON), licence/droits et CIDs, double lecture octets, contrat déployé et roles/codehash récents, owner valide l'opération, signature wallet, tx finalisée, nonce/destinataire/indexeur | #403, PR #407 | Owner/artist + opérateur minter + revue indépendante |
| Marché NFT EGLD : listing / achat / enchères | **NO-GO** | Deux wallets sur testnet, dépôt NFT, achat, royalties/frais, cancel, surenchère/refund, panne/timeout et receipt, puis pilote mainnet à plafond et signatures distinctes | #428 | Vendeur + acheteur + owner contrat |
| RWA / art physique / escrow | **NO-GO fonds** | Chaîne de titre, authenticité, état physique, reçu, litiges, attestor, stockage historique v1/v2, audit VM et code déployé, légalité de l'escrow | PR #430 | Owner + juriste/attestateur + audit indépendant |
| XA World Rights / plugins téléchargeables | **NO-GO licence payante** | Droit d'auteur exact, choix propriétaire vs MIT+SaaS, suppression éventuelle des distributions publiques incompatibles, droit d'accès serveur, exemption owner via signature, révocation/refund | #416 | Titulaire des droits + juridique |
| Multichaîne Polygon/Solana / OpenSea | Découverte externe partielle uniquement | API fournisseur prête et stable, identité par réseau, wallets séparés, contrats/ordres, sécurité et settlement propres ; aucun bridge implicite | #391 #393 | Revue indépendante par réseau |
| DAO et gouvernance | Simulation/présentation | Registre et scrutins vérifiables sur chaîne, délégation, votes/finalité/audit ; pas de prétention de gouvernance pour vote local | #393 | DAO/owner + audit |
| LIA, agents, télémetrie, trading | PAPER / lecture selon route | Publisher authentifié, freshness TTL/source, mandats et quotas, audit, tests. Trading exige **autre** autorisation séparée | #347 #367, PR #454 | Owner + risk/security |
| Domaine et contact commercial | **Ne pas publier mailbox non vérifiée** | Résolution du registrar hold, DNS MX/SPF/DKIM/DMARC, 2 envois et 2 réceptions externes, réponse effectivement reçue | #341, PR #476 | Propriétaire du domaine |

## Chaîne de preuve de paiement et de livraison (G02, G03, G10, G11, G12)

1. Base de données **réellement connectée au backend déployé** identifiée sans exporter de secret ; schéma, migrations versionnées, sauvegarde, restauration, droits d'accès, locking et idempotence multi-workers.
2. Ordre serveur immuable : produit, prix, monnaie, acheteur et identifiants prestataire ou tx MultiversX ; jamais d'accès accordé sur redirect de succès.
3. Fiat : signature et corrélation webhook/IPN, ordre des événements, rejouement et remboursement. Crypto : devis récent, bon chainId/SC/nonce, transaction wallet volontaire et lecture indépendante de finalité.
4. NFT : médias et métadonnées réels, rôle mint, on-chain tokenID/nonce, propriété du destinataire et URI vérifiée avant toute mention de livraison.
5. Droits : entitlement backend créé **une seule fois** après preuve du service souscrit ou livraison NFT selon produit ; expiration, annulation, dispute et révocation testées.
6. Rejets obligatoires : webhook forgé/dupliqué, SIWX expiré, prix périmé, perte réseau, transaction rejetée, WALLET absent, mauvais destinataire, retrait anticipé des fonds, reorg et panne base.
7. Dossier par capacité : commit SHA + build servi + ABI/codehash + configuration redigée + journaux de tests et d'incidents + CI exacte + procès-verbal de revue indépendante + rollback / pause exercés en bac à sable.
8. Une décision GO est datée, limitée à une **capacité** et à des adresses, versions, réseaux et plafonds explicites ; toute dérive remet cette capacité à NO-GO.

## Séquencement opératoire — aucune bascule globale

1. **P0 documentaire / publication** : revue release #466 et branche de ce dossier ; résoudre prix historiques contradictoires, vérifier SHA Pages/Render, mobile 375–414px et navigation sans wallet. Les neuf PR ouvertes ne doivent pas être fusionnées en bloc (notamment majors TS / WalletConnect).
2. **P0 identité & infra** : choisir le projet PostgreSQL de production, prouver la liaison Render/DB via empreintes non sensibles, tester restauration + concurrence ; chiffrer stockage et incident ; établir auth email/SIWX, compte sans wallet distinct.
3. **P0 fiat service** : utiliser Stripe Nelsonprods comme PSP d'abonnement choisi, préparer les mensualités **3,79 / 5,79 / 9,79 €** sans créer de session ou de produit avant décision séparée, déterminer TVA/CGV, puis recetter un backend sandbox et webhooks durables. Les anciens produits Stripe one-time sont à examiner hors checkout, sans mutation implicite.
4. **P0 art/IPFS** : droits explicites des fichiers #005, upload sécurisé de tests en bac à sable, CIDs et SHA exacts, pins indépendants, JSON canonique ; pas de divulgation des originaux privés.
5. **P0 MultiversX** : relecture mainnet RO du codeHash, rôles, prix et URIs ; testnet wallets vendeur/acheteur ; mint Pulse #005 owner-only **seulement après signature explicite dédiée**, confirmation bloc, token et URI.
6. **P0 règlement / livraison** : rejouer les parcours fraude/panne/remboursement ; audits paiement (S1) et NFT/droits (S2) ; ne pas accorder d'entitlement sur statut UI.
7. **P1 autres modules** : sécurité RWA, licence des plugins, OpenSea API read-only, sources LIA, votes DAO ; chaque module a sa recette indépendante et son statut honnête.
8. **Ouverture progressive** : d'abord site de découverte, puis pilote unitaire contrôlé, puis capacité marchande précise après validation humaine et tests de retour arrière. Aucune promesse de rendement ni de trading automatisé.

## Validation humaine par capacité (gabarit à dupliquer)

- Capacité / SKU / réseau / environnement / plafond : **À définir**
- Responsable propriétaire : **À désigner explicitement**
- Prestataire / identifiants publics de contrat et destinataire : **À vérifier**
- Politique tarifaire chiffrée et conditions légales approuvées : **NON CERTIFIÉ**
- Commit SHA, build servi, CI et tests adversariaux : **NON CERTIFIÉ**
- Preuves PSP / VM / IPFS / on-chain / DB / réconciliation : **NON CERTIFIÉ**
- Second relecteur indépendant + références de preuves : **NON CERTIFIÉ**
- Procédure pause/rollback testée et support opérationnel : **NON CERTIFIÉ**
- Autorisation signée, horodatée, limitée à cette capacité : **ABSENTE**
- **Décision : NO-GO**

### Actions interdites par cette préparation

Ne pas activer PAYBOX_CHECKOUT_ENABLED, MINT_LIVE_ENABLED, MINT_DISPATCH_ENABLED, CREATOR_MEDIA_UPLOAD_ENABLED, STUDIO_GLB_UPLOAD_ENABLED, VITE_GENESIS_COMMERCIAL_GO, les ventes Stripe/Whop, les grants SC, le bridge ou LIA_LIVE_TRADING. Ne pas créer/faire signer/broadcaster de transaction, modifier une base de production ni dépenser des fonds à partir de ce dossier.

Références : [launch gates](../security/launch-gates.md), [scope MultiversX-first](MULTIVERSX_FIRST_LIVE_SCOPE_2026-11-08.md), [Genesis gate](GENESIS_COMMERCIAL_GO_GATE_2026-11-03.md), [commercial model](../COMMERCIAL_MODEL.md), [README](../../README.md).

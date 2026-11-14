---
description: >-
  Priorités xArtists vérifiées au 14 novembre 2026 : bêta publique, Studio/IPFS
  et preuves de transactions avant ouverture commerciale.
icon: route
---

# Feuille de route

**Référence publique :** [**version 0.139.0**](https://xartists.art/build-info.json) **· SHA `7b280ccf…` · 14 novembre 2026.** Les annonces de fonctionnalités ne remplacent ni les tests en conditions réelles ni les reçus sur la blockchain.

xArtists privilégie une dApp simple pour les artistes, les galeries et les visiteurs : **découvrir → exposer → préparer une œuvre → publier de façon consentie → créer un NFT signé → vendre seulement quand l'achat et la livraison sont prouvés**.

## Déjà livré en bêta

* **Parcours visiteurs #590** : musée, galerie 3D, Studio, marketplace et navigation mobile ; découverte sans wallet. Les quatre choix débutants ne masquent pas les modules avancés.
* **Expositions 3D portables** : brouillons locaux jusqu'à 16 œuvres, export et réimport JSON, sans publication automatique ni vendeur fictif.
* **Catalogue NFT honnête #592** : retrait des originaux Drive du catalogue. Les NFT réellement trouvés sur MultiversX restent consultables ; l'index externe non certifié reste signalé.
* **Préparation du stockage** : script de coffre privé à empreinte SHA-256, tests d'intégrité et configuration Kubo auto-hébergée **non démarrée**. Aucun original Drive réel ni pin n'est créé par ces livraisons.
* **xOrus** : interface de signaux et analyses en mode simulation (_paper_), sans trading live ni abonnement commercial certifié.

## Prochains jalons avec preuves exigées

| Priorité                     | Réalisation                                                                                                               | Condition de validation                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0 — Wallet xPortal #506** | Autoriser les domaines exacts dans Reown et corriger la connexion réelle.                                                 | QR/URI depuis le site public, approbation dans xPortal, adresse correcte affichée ; aucune signature de paiement implicite.                       |
| **P0 — Base Studio**         | Identifier le Postgres **externe** de l'API, en faire la sauvegarde puis appliquer 004 → 005, 006 pour GLB si nécessaire. | Le statut Studio ne renvoie plus `migration_004_missing` ; schéma contrôlé **sur la DB réelle**, index et statuts vérifiés.                       |
| **P0 — Médias et IPFS**      | Authentifier le créateur, contrôler ses droits et publier une œuvre de recette autorisée.                                 | Octets originaux et SHA-256, CID, métadonnées, lecture indépendante et sauvegarde testée ; upload activé uniquement après le préflight.           |
| **P0 — Marketplace #428**    | Listing propriétaire signé, dépôt, achat par un wallet différent et réception du NFT.                                     | Hash de transaction et preuve de livraison on-chain, frais/prix réconciliés, pas de ventes simulées.                                              |
| **P1 — Comptes et services** | Consolider comptes sans wallet, rôles artistes/galeries, permissions et moyens de paiement.                               | Session email vérifiée, contrôle d'accès, webhooks, livraison et réconciliation du paiement sur chaque produit.                                   |
| **P1 — Galerie en ligne**    | Publier de vraies expositions 3D hébergées, avec catalogues et oeuvres distincts des tokens.                              | Origine et droits, médias hébergés, contrôle d'accès, liens NFT vérifiables et retrait documenté.                                                 |
| **P2 — Intelligence xOrus**  | Rendre les signaux, sources gratuites autorisées, analyses dérivées et agents décisionnels compréhensibles.               | Provenance et licences vérifiées, mode paper par défaut, consentement, limitations de risque et droits d'accès certifiés avant commercialisation. |
| **P2 — Art physique et 3D**  | Jumeaux numériques, certificats de provenance et parcours sculptures.                                                     | Preuves techniques, droits, chaîne de garde et livraison physique indépendamment du NFT.                                                          |

## Le cycle Drive → serveur → IPFS → MultiversX

1. Google Drive reste la **réserve privée des originaux**, non une source directe du catalogue NFT.
2. Un artiste autorise **chaque** œuvre ; sa copie originale est conservée sur un volume privé xArtists et contrôlée par SHA-256 avec sauvegarde hors site.
3. Une copie publique autorisée peut être épinglée sur Pinata ou un nœud Kubo administré ; le Studio existant utilise Pinata et l'option Kubo **n'a pas d'adaptateur d'upload intégré** à ce jour.
4. L'artiste valide ses métadonnées puis signe **lui-même** le mint MultiversX ; un CID ou un bouton ne vaut pas confirmation blockchain.
5. La mise en vente et la livraison restent soumises au contrôle spécifique **#428**.

**Aujourd'hui :** l'API annonce `studio_media_upload=off` et le diagnostic PostgreSQL `migration_004_missing`. Aucune migration ne sera lancée sans base identifiée et sauvegardée. Le compte Render n'héberge pas de PostgreSQL ; **l'hôte externe exact n'est pas encore identifié de façon sûre**.

## Méthode de publication

Une PR fusionnée ou une CI verte prouve un état du code, pas une transaction, un accès wallet ni une conservation IPFS durable. Les drapeaux financiers restent fermés jusqu'aux preuves requises et au consentement explicite du propriétaire. Les simulations xOrus ne passent pas automatiquement en exécution.

Les partenariats peuvent commencer par des œuvres autorisées, des expositions **brouillon**, des tests de compatibilité et des revues techniques sans promesse commerciale.

[**État détaillé du produit**](etat-du-produit.md) · [**Guide Drive, sculpture et mint**](creer-vendre-nft-ipfs-drive.md) · [**Présentation**](./) · [**Contribuer**](contribuer-et-partenariats.md)

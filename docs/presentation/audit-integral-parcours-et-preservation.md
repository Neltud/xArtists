# xArtists — Audit fonctionnel 360°, parcours et conservation des œuvres

> Revue du 5 novembre 2026 · périmètre : `Neltud/xArtists`, frontend, Access API, documents et 7 captures mobiles communiquées par l'utilisateur.
> **Audit de code, de contrats et de captures**, et non audit financier ou test utilisateur à grande échelle. « Page présente » ≠ « action financière opérationnelle ».

## 1. Verdict : ce qui est réellement accessible

Le registre `apps/frontend/src/experience/modules.ts` expose **40 modules** répartis en cinq familles, de nombreux alias et une structure SPA. Les contrôles automatiques de routes vérifient 121 chemins générés, mais ne prouvent ni la disponibilité de tous les fournisseurs externes, ni la réussite d'une transaction.

L'interface a trois statuts éditoriaux dans `publicReadiness.ts` :

- **À consulter** : lecture, découverte ou écran disponible. Aucun achat, mint, bridge ou vote réel impliqué.
- **En aperçu** : UI locale/paper, brouillon ou fonction partielle.
- **En préparation** : capacité économique non prouvée, fonctions d'exécution fermées.

Cette classification ne remplace **pas** un service backend de capacités. Toute opération manipulant une monnaie, un token, une propriété ou un droit doit avoir son propre prévol technique et sa preuve de finalité.

### Inventaire exhaustif des 40 modules

| Famille | Module · route canonique | État éditorial | Parcours / diagnostic et contrôle prioritaire |
| --- | --- | --- | --- |
| Découverte | Maison · `/explore/maison` | Consultation | Page d'orientation, ne doit pas ressembler à une salle d'exécution |
| Découverte | Musée · `/explore/museum` | Consultation | Artworks réels distingués des visuels illustratifs ; mode mobile et WebGL optionnel |
| Découverte | Enchères · `/explore/auction` | Aperçu | Aucun enchérissement réel ; vérifier droits, garde, règlement, textes visibles en thème clair |
| Découverte | RWA · `/explore/rwa` | Aperçu | Ne pas induire transfert d'un bien physique par NFT ; provenance indépendante |
| Découverte | Marketplace · `/explore/market` | Consultation | Explorer réel ≠ ordre signé ≠ listing vendable ; distinguer réseau et places externes |
| Découverte | Tours · `/explore/tours` | Aperçu | Ne pas promettre un guidage ou une réservation active sans source |
| Découverte | Analytics · `/explore/analytics` | Aperçu | Date de fraîcheur, origine, absence de métriques inventées |
| Découverte | Editions · `/explore/editions` | Aperçu | Vérifier métadonnées et réelle collection avant achat |
| Découverte | Venues · `/explore/venues` | Aperçu | Lieux / expériences et réservations non vérifiées |
| Découverte | Guide · `/guide` | Consultation | Départ sans wallet ; expliciter les parcours en trois gestes |
| Création | Studio · `/create/studio` | Aperçu | Upload signé côté serveur puis CID, metadata et rôle NFTCreate ; test réel manquant |
| Création | NFT Factory · `/create/nft-factory` | Aperçu | Traits/JSON PAPER, aucun rendu IA ni paiement réel ; formulaires mobiles à contrôler |
| Création | Digital Twin · `/create/digital-twin` | Aperçu | Aperçu ≠ passeport physique/Art-ID certifié |
| Création | Academy · `/create/academy` | Aperçu | Contenu accessible ≠ droit/abonnement validé |
| Création | Visibility · `/create/visibility` | Aperçu | Campagnes et ventes non déclenchées implicitement |
| Intelligence | LIA · `/intelligence/lia` | Aperçu | Ne pas simuler de trading LIVE ; horodatages et origine télémétrie |
| Intelligence | Agents · `/intelligence/agents` | Aperçu | Packs IA consultables, livraison réelle sous gates S1/S2 |
| Intelligence | Command · `/intelligence/command` | Aperçu | Mandats signés, quotas, relecture et validation humaine |
| Intelligence | Lightning · `/intelligence/lightning` | Aperçu | Mesure d'exécution ≠ execution autorisée |
| Intelligence | Simulation · `/intelligence/simulation` | Aperçu | PAPER visiblement marqué et non confondu avec profit |
| Intelligence | Entities · `/intelligence/network` | Aperçu | Graphe descriptif ≠ identité agent vérifiée |
| Finance | Trading · `/finance/trading` | Préparation | Ordres LIVE interdits sans mandat, ledger, anti-rejeu et contrôle de risque |
| Finance | TRO · `/finance/tro` | Consultation | Token `TRO-94c925` informations sans faux prix, supply ou bénéfices |
| Finance | TRO / Solana · `/finance/tro/sale` | Consultation | Informations seulement : vente Solana et bridge non prouvés |
| Finance | Staking · `/finance/staking` | Préparation | DEX externes distincts. Gouvernance proportionnelle au **$TRO staké seulement** |
| Finance | LP · `/finance/liquidity` | Préparation | Données DEX hétérogènes. Aucune liquidité garantie par xArtists |
| Finance | Hatom · `/finance/hatom` | Préparation | Liens externes et risque DeFi à distinguer du protocole |
| Finance | Burnify · `/finance/burnify` | Préparation | Pas de batch burn sans preuves chain exactes |
| Finance | DAO · `/finance/governance` | Aperçu | Propositions / votes locaux ou démo ≠ vote on-chain ; poids TRO staké uniquement |
| Finance | Sale · `/finance/sale` | Préparation | Aucun checkout réel sans quote et livraison prouvée |
| Finance | Support · `/finance/support` | Aperçu | Pourboire/soutien non confondu avec investissement |
| Espace | App · `/app` | Consultation | Installation/PWA, pas une preuve de transaction |
| Espace | Wallet · `/workspace/wallet` | Consultation | Séparer lecture seule, signature réellement disponible et session expirée |
| Espace | Portfolio · `/workspace/portfolio` | Aperçu | Positions réelles ≠ prix reconstitué ≠ droits d'accès |
| Espace | My Packs · `/workspace/agents` | Aperçu | Livraison dépend d'une preuve de propriété ou d'accès serveur validée |
| Espace | Identity · `/workspace/identity` | Aperçu | Pas de publication de données personnelles en stockage immuable |
| Espace | Payments · `/workspace/payments` | Aperçu | Historique consultable ≠ facture réglée |
| Espace | History · `/workspace/history` | Aperçu | Événements et statuts issus de traces réelles, pas de démo LIVE |
| Espace | Status · `/workspace/status` | Consultation | Distinction claire entre heartbeat backend, lecture et mutation financière |
| Espace | Legal · `/legal` | Consultation | Conditions, propriétaire artistique, RGPD et facturation |
| Total | **40 modules** | 10 consultation / 24 aperçu / 6 préparation* | *Comptage conservateur de la classification éditoriale, pas des transactions disponibles* |

> Note : les listes sont basées sur l'état éditorial de `publicReadiness.ts`; ne pas utiliser ce tableau comme preuve d'une transaction. Les alias `/marketplace`, `/auction`, `/studio`, `/dao`, `/staking`, `/lp`, `/nft-factory` restent les liens orientés grand public.

## 2. Audit des parcours : 12 flux critiques

| # | Chemin | État / blocage | Vérification de sortie |
| --- | --- | --- | --- |
| 01 | Accueil → Musée → œuvre → Marketplace | Lecture accessible ; les œuvres doivent être vraies et sourcées | Galerie ouvre les mêmes assets/identifiants sans demander de wallet |
| 02 | Accueil → recherche → route directe → retour mobile | 121 chemins générés testés dans la CI ; vérifier encore les événements, les états et les sous-pages | 360/390/430px, clavier et lecteur d'écran, sans défilement horizontal |
| 03 | Marketplace → Solana / Polygon OpenSea | Consultation API, pas de listing signé xArtists | Slug/chain vérifiés, erreurs lisibles, URLs de vente chez le fournisseur |
| 04 | Studio → sélectionner image/vidéo → upload | Code backend présent ; **OFF** sans Pinata JWT, DB et feature flag | SIWX xPortal signé, MIME/magic, quota, SHA-256, récupération du même octet |
| 05 | Upload → JSON metadata → mint NFT MultiversX | Métadonnées Pinata prévues, signature wallet artiste ; finalité mainnet non démontrée | Test humain + rôle, hash CID, tx finalisée, NFT visible à l'adresse |
| 06 | NFT Factory → modèles/calques → 100 variations → crédits | Papier uniquement, pas de fournisseur génératif ni devise réelle | Génération image vérifiable, droits, crédits et coûts signés avant monétisation |
| 07 | Distributeur → escrow/lazy mint → tirage → vente | Préparation ; SC aléatoire audité absent | Contrat, nonce, stock, paiement, remboursement, propriété finale |
| 08 | Enchère physique → paiement EUR → transfert RWA | Salle en démonstration ; garde et homologation non prouvées | Lot certifié, arbitrage, paiement réconcilié, livraison physique |
| 09 | Genesis Packs → checkout → IPN → mint → My Packs | **P0 #281** : pas de preuve transactionnelle end-to-end | Idempotence, événement signé, chain finality et droit associé au wallet |
| 10 | DAO → stake TRO → vote | Démo ; pouvoir de vote = $TRO staké, pas LP/NFT | SC audit, snapshot exact, transaction finale, résultat lisible |
| 11 | $TRO → pool xExchange/OneDex → bridge Solana | Informations et liens tiers ; pas de bridge opérationnel attesté | Vérifier canonique, supply, collatéral, réserve/LP et double comptabilisation |
| 12 | LIA intent → mandat → quote → exécution | Paper-first ; P0 #369/370 | Wallet signé, budget, anti-rejeu, expiration, annulation et journal indépendant |

## 3. Problèmes UX observés sur les captures Android

- **P0 contraste** : avertissements jaune pâle sur blanc et texte des cartes DeFi héritant de styles conçus pour un fond sombre. Le thème clair global a écrasé des fonds sans migrer les encres.
- **P0 navigation** : wallet long qui masque ou déporte l'action menu ; le menu doit rester un contrôle 44px et la chaîne complète doit rester accessible sans s'afficher en entier.
- **P0 mobile Studio** : champs de calques/seed/JSON qui débordent ; préférer des sous-formulaires à largeur bornée et des éléments empilés.
- **P1 densité** : trop d'explications serveur (`AUCTION_ENABLED`, payout, webhook) dans les pages publiques. En premier niveau : « À consulter » puis « Ce qui manque pour acheter » ; détails techniques sur demande.
- **P1 superpositions** : widget musical devant les boutons et dock, sous-parties masquées. Sur mobile, lecteur à la demande dans le menu.
- **P1 réalité financière** : liens « Ajouter de la liquidité » qui sont en réalité des liens vers DEX externes. Nommer leur destination avant le clic.
- **P1 lisibilité de la roadmap** : appliquer le même statut éditorial à l'accueil, à la carte, au détail et aux modules internes ; ne pas remplacer les permissions backend.

Corrections visuelles ciblées en PR #399 ; les tests navigateur doivent **tous** réussir avant publication. Les captures seules ne prouvent pas les fonctions non visibles ni la compatibilité des lecteurs d'écran.

## 4. Préservation : deux registres, pas une fausse base immuable

La transaction, le NFT et la propriété restent **sur leur blockchain native**. Le catalogue public (PostgreSQL/Neon) est une **projection modifiable** reconstruite à partir d'événements signés et de preuves.

- Médias : fichiers maître image/vidéo, dérivés, jaquette vidéo, miniatures et licences séparées. SHA-256 de chaque fichier.
- IPFS : Pinata / fournisseur secondaire **réellement distinct** + CID, récupération multi-gateway. Deux gateways vers un même pin **ne prouvent pas** deux copies indépendantes.
- Archivage long terme : Arweave pour originaux autorisés + métadonnées, transaction identifiée, empreinte SHA-256 identique, frais de dépôt vérifiés et confirmation. Aucun octet déposé sans approbation de coût et droits.
- Registre de preuves : événements append-only (hash originaux, CID, Arweave TxID, consentement, destinataire NFT, chain ID, tx, dates, versions). Ancrage périodique des racines de preuve sur blockchain native après revue.
- PostgreSQL : recherche, statuts, quotas, paiements et tâches ; jamais source unique de permanence ni preuve on-chain.
- Drive privé : sauvegarde périodique des originaux et export du registre en lecture maîtrisée, **non utilisé comme URI canonique NFT**.
- Drive public : uniquement vignettes / dossiers **approuvés pour diffusion** avec licence vérifiée, jamais source unique, jamais secrets ou cartes d'identité.
- GitBook : documentation, catalogue explicatif, liens de preuve et liens vers la dApp. **Pas checkout, marketplace ou stockage de médias de référence.**
- Backups : au moins trois copies, deux technologies de stockage, une copie sous un autre domaine administratif ; contrôles SHA-256/retéléchargement et restauration programmée.

**Statuts honnêtes de conservation** :
`LOCAL_PREVIEW` → `UPLOAD_AUTHORIZED` → `IPFS_PINNED` → `IPFS_HASH_RETRIEVED` → `ARCHIVE_TX_SUBMITTED` → `ARCHIVE_CONTENT_VERIFIED` → `METADATA_PINNED` → `WALLET_MINT_SUBMITTED` → `CHAIN_FINALIZED` → `MARKET_INDEXED`.

Aucun statut ne permet de promettre « conservé pour toujours ». Après modification des octets ou des métadonnées, un **nouveau CID** et une nouvelle preuve sont nécessaires. Versionner sans écraser le précédent.

## 5. Publication / ventes : à ne pas confondre

- **xArtists** : portail principal, Studio, provenance, présentation des œuvres, orientation de l'acheteur.
- **OpenSea Polygon / EVM** : collection EVM réellement déployée et détenue par l'artiste ; publication signée selon les capacités officielles.
- **OpenSea Solana** : **listing possible de certaines collections existantes** depuis août 2026 ; OpenSea Studio **ne mint pas les collections Solana**. La création de NFT Solana exige un flux natif séparé.
- **MultiversX** : collection artiste contrôlée et minée avec ses droits et son wallet ; marketplaces natives après preuve de compatibilité.
- **Shopify (si connecté)** : vente d'œuvres physiques/produits autorisés, inventaire et livraison ; ne pas convertir une image d'un NFT en garantie de vente.
- **Etsy** : uniquement biens physiques admissibles selon leurs règles ; **NFT interdits** (politique au 5 octobre 2026). Aucun contournement du paiement hors plateforme.
- **GitBook** : preuves, FAQ, droits d'utilisation, feuille de route, pas commande.
- **Google Drive** : archive/visuels publics sélectionnés, **pas vente ni preuve de propriété**.

## 6. Ordre d'exécution recommandé et critères GO

**P0a** Corriger CSS contrastes, formulaires, menu et libellés (PR #399, CI complète).

**P0b** Activer l'upload média **seulement après** secret Pinata dédié dans Render, base Render liée vérifiée, migration SQL revue, budget/quotas, signature SIWX, restauration et vérification indépendante d'un vrai fichier ; aucun JWT dans le navigateur.

**P0c** Implémenter manifest de conservation et contrôle de récupérabilité des octets (script `mediaDurability.mjs`). L'archive Arweave et le pin secondaire demandent contrat d'hébergement/facturation et accord explicite, pas un simple plugin.

**P0d** Valider le flux de bout en bout : média → CID → métadonnées → rôle → mint signé → finalité → indexeur → affichage après rechargement ; puis commande/paybox, livraison et preuve S1/S2 #281.

**P1** Vérifier ownership et listing natifs Solana/Polygon ; publication d'un catalogue de preuves dans GitBook ; restauration périodique Drive privé.

**P2** Index décentralisé d'événements avec journal signé et ancrage chaîne, images de restauration, connecteurs de boutiques et archivage vidéo volumineuse après validation de coûts.

Pas d'activation de `mint_live_enabled`, `paybox_checkout_enabled`, `LIA_LIVE_TRADING`, bridge, burn ou paiements sans preuve. Chaque vérification GO doit citer une capture, une transaction, un timestamp, un SHA, un opérateur et son résultat.

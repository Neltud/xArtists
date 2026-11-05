# Audit transverse xArtists — modules, routes, flux, permanence et diffusion

**Date : 5 novembre 2026 — code examiné sur `main` au SHA `13aad62633f3bc41bd9f7f5383c21d11dca43e4d`.** Ce document n'est pas une certification de production ni une inspection transactionnelle du réseau. Les captures de téléphone transmises par le propriétaire et les tests de la PR #399 éclairent les défauts visuels. Les bases Neon consultées sont des **sandboxes**, pas des preuves de connexion Render production.

## 1. Inventaire réel

La source `apps/frontend/src/experience/modules.ts` déclare **40 modules** regroupés en 5 familles et **60 alias de modules**, soit 100 destinations déclarées canonique/alias. Le générateur `apps/frontend/scripts/publicAvailability.mjs` ajoute les routes d'entrée, pages packs, navigation, roadmap et la récupération 404 GitHub Pages.

La matrice `apps/frontend/src/experience/publicReadiness.ts` compte **10 modules de consultation**, **24 d'aperçu** et **6 de préparation**. Ce sont des **statuts éditoriaux**, jamais un inventaire automatique de transactions live.

| Famille | Consultation | Aperçu / démonstration | Préparation / non prouvé |
|---|---|---|---|
| Découverte | Maison, Musée, Marketplace, Guide | Enchères, RWA, Tours, Analytics, Éditions, Venues | — |
| Création | — | Studio, NFT Factory/Distributeurs, Digital Twin, Academy, Ads | — |
| Intelligence | — | LIA, Agents, Command, Lightning, Simulation, Entities | — |
| Finance | Informations $TRO, page multichaîne informative | DAO local, Support | Trading, Staking, Liquidité, Hatom, Burnify, Vente |
| Espace personnel | PWA, Wallet consultable, Statut, Légal | Portfolio, Packs, Identité, Paiements, Historique | — |

**Attention :** des liens vers un DEX, des comptes d'artistes ou une marketplace externe peuvent fonctionner même lorsque l'exécution financière **xArtists** reste désactivée. Ne pas déduire qu'une « fonction finance » est active au seul motif qu'un site tiers l'est.

## 2. Audit par flux utilisateur

| # | Parcours et routes | Preuves / comportement observé dans le code | Maturité et défaut prioritaire |
|---|---|---|---|
| 1 | Accueil `/`, Maison `/maison`, Musée `/museum`, Guide `/guide` | Découverte publique, sans wallet. Guides et signaux parfois excessivement techniques sur mobile | Consultation ; uniformiser la lisibilité et masquer détails internes par défaut |
| 2 | Explorer `/marketplace`, `/auction`, `/rwa` | Listings indexés en lecture seule, fiches RWA à vérifier et salle d'enchères sans adjudication attestée | Consultation/aperçu ; aucune vente réelle inférée |
| 3 | Artiste `/studio`, `/nft-factory` | L'usager peut préparer un brouillon; création IA payante non reliée à fournisseur. Le Studio dispose d'un chemin upload + mint signé, conditionnel | Aperçu; ne pas confondre trait papier, pixel rendu, CID et NFT créé |
| 4 | Upload `POST /v1/studio/media/*` | `creatorMedia.mjs`: SIWX, MIME+magic bytes, SHA-256, quota 8/j, Pinata JWT serveur, PG, PNG/JPG/WebP <=16 MiB, MP4 <=48 MiB | **P0** : aucune preuve de service productif ni de readback après pin; stockage en un seul fournisseur |
| 5 | Métadonnées NFT | Image: `image:ipfs://...`; vidéo: `animation_url:ipfs://...`; wallet et SHA-256 référencés, UUID en base | **P0** : registre d'archive vérifié séparément, conservation des originaux et reprise des pins manquants |
| 6 | Mint artiste MultiversX | `useStudioMintTx.ts`: émission collection, rôle `ESDTRoleNFTCreate`, `ESDTNFTCreate` signé par wallet artiste et statut pending/confirmed | **P0** : preuve mainnet d'un premier vrai mint, finalité + propriété vérifiées, sans signature automatisée |
| 7 | Marchés externes Polygon / Solana | `OpenSeaCollectionPanel` est une découverte externe, pas un minter/listing natif sur ces réseaux | **P1 #391** : contrats, wallets, collection et signature par réseau, découverte != création |
| 8 | Paiement / Packs / Fiat | `/offres`, `/my-packs`, `/workspace/payments` : interfaces publiques mais chaîne paiement→livraison non attestée | **P0 #281 #370 #328** : settlement signé, idempotence, mint, ownership, remboursements |
| 9 | DAO `/dao` | Poids de vote proportionnel aux **$TRO stakés uniquement**; propositions/votes locaux `onChain:false` | Aperçu; nécessité de contrat on-chain, ancrage de votes et audit |
| 10 | LIA / Agents / Trading | LIA exploratoire/paper, pas de mandat d'exécution complet prouvé | **P0 #369 #368 #367** : classifier sûr, mandate signé, anti-rejeu, garde-fous avant tout ordre |
| 11 | $TRO / DEX / Bridge | Informations réseau et liens externes ; le bridge et la liquidité xArtists ne sont pas prouvés | **P1 #298 #353** : audit supply, garde du collatéral, wallet émetteur, LP/propriétés |
| 12 | Mobile 360/390/430 | Captures utilisateur : texte jaune sur blanc, wallet occupant l'entête, lecteur musical sur le contenu, formulaire NFT débordant et cartes LP peu contrastées | **P0/UX PR #399** : changement en revue, tests navigateur obligatoires avant merge |

Les routes canoniques restent accessibles; les alias historiques doivent rediriger vers une route stable et être vérifiés au build. Le domaine `xartists.art` et les emails du domaine ne doivent pas être qualifiés d'opérationnels sans vérification DNS/MX (#341).

## 3. État du stockage tel que constaté

- Backend existant : `services/access-api/src/creatorMedia.mjs`. `studioMediaConfig()` exige `CREATOR_MEDIA_UPLOAD_ENABLED=1`, un `PINATA_JWT` secret, `DATABASE_URL` persistante et `ACCESS_JWT_SECRET`/secret JWT.
- Le pin du fichier est déclaré `status=pinned` dans PostgreSQL après réponse Pinata contenant un CID ; aucune validation secondaire par **récupération HTTP + re-hachage SHA-256** n'a été constatée dans ce chemin. Le CID est stable, sa disponibilité ne l'est pas automatiquement.
- Le JSON de métadonnées est lui-même publié sur Pinata ; les droits sont déclarés par l'artiste. Ce n'est ni une décision juridique d'originalité ni une preuve de propriété matérielle.
- Une table `xartists_studio_media` et index sont décrits par `services/access-api/migrations/004_creator_media_pinata.sql`. Les deux **sandboxes Neon observées** (`xartists-access-sandbox` et `xartists-stripe-sandbox`) ne possèdent pas cette table. **Ne pas lancer la migration sur une sandbox non autorisée ; vérifier le rattachement exact de Render à la base de production avant toute écriture**.
- Aucune réplication entre deux fournisseurs indépendants, confirmation Arweave, rétention vérifiée, mécanisme de récupération d'originaux ou registre public de provenance horodaté n'est prouvé par les sources observées.

**Statut honnête :** code de pinning présent, activation et preuve de conservation indépendante **non vérifiées**.

## 4. Architecture cible — archives indépendantes et index portable

```
Fichier original (local) + déclaration de droits
  -> SHA-256, MIME/magic, limites et contrôle SIWX
  -> Upload signé côté backend -> Pinata -> CID (accusé réception seulement)
  -> Lecture réelle par gateway + re-hachage: même octets / même taille
  -> Copie IPFS chez un deuxième opérateur indépendant (preuve de pin)
  -> Arweave / Turbo (après devis, accord financier et preuve de confirmation)
  -> Copie privée chiffrée hors réseau (backup indépendant, vérifié)
  -> Metadata JSON versionnées et hashées, preuve de stockage + droits
  -> Enregistrement append-only signé de l'événement + ID Arweave/chaîne
  -> Index PostgreSQL/Neon de lecture (reconstructible, non présenté immuable)
  -> Vérification des rôles collection et signature de mint par l'artiste
  -> Confirmation on-chain -> indexation marketplace -> vente externe éligible
```

**Base « immuable » :** ne pas qualifier PostgreSQL, Google Drive ou GitBook d'immuables. Les **événements de provenance** sont signés et inscrits dans un registre append-only à empreintes chaînées, avec ancrage ponctuel sur chaîne / Arweave. Neon matérialise un état consultable et reconstruisible. Publier un nouvel événement pour toute correction ; ne jamais écraser un historique d'œuvre. Protéger les données personnelles : une archive publique durable est difficile à supprimer.

**Outil ajouté dans cette PR :** `scripts/ops/media-integrity-check.mjs` accepte un manifeste JSON contenant `media.uri,media.sha256,media.bytes,media.mime`, puis `--file` pour une comparaison locale ou `--network` pour re-télécharger et vérifier le hash sur des gateways publics autorisés. Les résultats **ne certifient ni duplication indépendante ni permanence**. Le Studio peut exporter une fiche JSON des preuves signalées, avec copies Arweave/secondaire explicitement `planned`. Aucun frais ni réseau n'est activé par ce script.

## 5. Où publier : responsabilités distinctes

| Canal | Contenu admissible / rôle | Dépendance non négociable |
|---|---|---|
| xArtists | Découverte, galerie, Studio, page d'archive et rapports | Lecture seule d'abord ; véritables actions par feature gate |
| GitBook | Guides publics, collections, feuille de route, métadonnées documentées et sources | Compte / site GitBook vérifiés ; **jamais l'original vidéo comme seule copie** |
| XOXNO / MultiversX | NFT effectivement minté + liste signée via wallet / conditions XOXNO | Preuve de propriétaire, collection, conformité, frais |
| OpenSea / Polygon | NFTs EVM natifs, indexation et ventes signées | Minter EVM distinct / vrai rôle du wallet, aucune affirmation de bridge implicite |
| OpenSea / Solana | Certains NFTs Solana existants éligibles à listing/achat | Mint Solana via fournisseur natif ; Studio OpenSea ne minte pas Solana |
| Etsy | Œuvres physiques originales éligibles | **NFT interdits** et pas de contournement par paiement externe |
| Shopify | Ventes physiques / marchand indépendant après configuration | Marchand et conformité, stock, transport, retours, settlement |
| Google Drive privé | Backup chiffré et versionné facultatif | Droits d'accès minimaux; aucun lien Drive public comme média exclusif NFT |

Références vérifiables : https://docs.ipfs.tech/concepts/persistence/ ; https://docs.ar.io/build/upload/ ; https://support.opensea.io/en/articles/16779830-can-i-create-a-solana-nft-on-opensea ; https://www.etsy.com/legal/policy/non-fungible-tokens-nfts-policy/1114711452112 ; https://gitbook.com/docs .

## 6. Sprints et critères de preuve

**P0-A :** terminer PR #399 mobile après 145/145 tests navigateur, détecter le menu avec wallet connecté, les contrastes réels, les 40 modules et aucun débordement. Aucun effet sur commerce.

**P0-B :** rapprocher configuration Render ↔ production Postgres ↔ migrations ↔ Pinata (JWT de service restreint sans jamais l'afficher). Tester upload autorisé image et MP4, contrôle du CID, téléchargement et empreintes identiques, metadata JSON puis vérification sur wallet. Les sandboxes ne sont pas une preuve suffisante.

**P0-C :** établir un **plan de rétention et restauration** : deux opérateurs IPFS indépendants, copie Arweave confirmée quand financée, backup privé chiffré, politique de renouvellement et surveillance périodique. Les détails de facturation, droits et protection des données doivent être approuvés avant toute publication irréversible.

**P0-D :** premier mint artiste mainnet à partir du fichier récupérable : consentement, vérification rôle, signature xPortal, finalité chain, identifiant token, propriété de l'artiste et métadonnées récupérées sur deux gateways.

**P1-E :** marketplaces par réseau (MultiversX, Polygon EVM, Solana), liens directs vérifiés, listing signé, test petit montant avec approbation explicite. Aucun mint cross-chain automatique inventé.

**P0-F :** chaîne S1/S2 financière : commande acceptée, PSP/IPN signé, anti-rejeu, livraison NFT ou remboursement, consultation « Mes Packs », rapprochement indépendant. Pas de GO tant que #281/#370 ne sont pas closes par preuves réelles.

**P1-G :** GitBook public comme manuel, source commune avec GitHub, export périodique Markdown; Google Drive/archives froides privées pour résilience et non publication unique.

## Limites de l'audit

Audit statique de fichiers et tests existants + photos fournies : les 40 modules ne sont **pas** certifiés fonctionnellement de bout en bout. Une vraie capture interactive de chaque flux sur serveur, la configuration de production et des transactions signées sont indispensables pour attester leur fonctionnement réel. Aucune clé, facture, œuvre ni NFT n'a été créé, transféré, supprimé, ni publié par cet audit.

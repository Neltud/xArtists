# xArtists NFT Factory / Art Engine / Distributor — V0 PAPER

**2026-11-05 · PR en revue · Ne pas activer le commerce.** Ce document décrit le parcours cible et l'implémentation strictement limitée au brouillon du frontend. Il ne constitue ni un audit, ni un contrat compilé, ni une preuve de mint.

## Parcours utilisateur

1. **Créateur** : artiste humain ou agent IA identifié. L'agent peut formuler un brouillon mais ne peut ni payer, ni dépenser des crédits réels, ni approuver des droits, ni signer à la place du propriétaire. Toute action financière requiert mandat signé borné (montant, TTL, collection, quotas, rôle) et approbation wallet.
2. **Art** : modèle prédéfini (Chromatic, Botanical, Monochrome) ou calques libres avec variantes pondérées. Quantité de brouillon : 1 à 100. Seed conservé, `planDigest` SHA-256 ; répartition déterministe des traits. Les poids ne garantissent pas une rareté strictement exacte. Les éditions peuvent partager les mêmes traits et aucune image n'est encore rendue.
3. **Fiches NFT** : métadonnées par édition (nom, description, traits et éventuels attributs additionnels), édition numérotée, export JSON. `image:null`, `animation_url:null`, états `not_generated_or_uploaded` et `not_minted` tant que le fichier et son CID ne sont pas prouvés.
4. **Devis IA payant (futur)** : catalogue versionné de modèle/image/résolution/couches/nombre, tarifs serveur signés et TTL, coût modèle/stockage/PSP, prix public en unités mineures. Aperçu actuel = 3 **crédits PAPER** par image, conformément au brouillon #374 ; **pas de devis commercial**, débit, revenu ou crédit utilisable. Réserver exactement une fois après identité et droits, pas avant.
5. **Rendu** : envoyer séparément chaque plan trait/prompts à un fournisseur d'images réel (OpenAI, AMD/NVIDIA hébergé, autre), avec adaptation de contenu et limites : droits, quotas, timeout, rappel asynchrone signé, réessai idempotent, facture réelle + coût de GPU constaté. Retourner un objet prouvable `asset_sha256`, MIME, provenance provider, token de facture et statut `pending|generated|failed|unknown`. Ne pas décrémenter des crédits réels sur une réponse inconnue. Utiliser `validateCreatorMedia` et `creatorMedia.mjs` pour toute validation d'image IPFS, pas une seconde pile de stockage.
6. **Art-ID et Steward** : contrôle de provenance et doublons via **xArtists Art-ID Forensics**, revue de droit d'auteur et consentement, vérification distincte d'éventuelles œuvres physiques via **Physical Art Steward** ; aucune revendication de propriété matérielle par simple NFT. Si un contrôle n'est pas connecté, afficher `not_verified`, jamais `verified`. Trailer Producer peut générer une promotion séparée à partir des médias approuvés, sans les muter.
7. **Mint** : le Studio existant prépare l'émission `issueNonFungible`, rôle `ESDTRoleNFTCreate`, pin metadata IPFS, validation nonce/titre/royalties et transaction **signée par le wallet artiste**. Le paiement de la *génération d'images* et celui de la *vente NFT* restent deux rails distincts. Les packs Genesis Pulse/Yield/Sentinel ne doivent jamais être créés par le minter d'œuvres génériques.

## Deux modèles de distributeur par collection

**A. Stock déjà minté (escrow_inventory)**

- L'artiste fournit les identifiants on-chain de NFT appartenant à **une seule collection**, avec nonces positifs, sans doublon.
- Après déploiement **audité**, il transfère les NFT par transaction signée vers un endpoint de dépôt qui attribue les NFT au contrat. Ne jamais proposer un simple envoi à une adresse non vérifiée : les transferts directs peuvent contourner le contrat et ne pas inscrire l'inventaire.
- Le SC maintient l'inventaire disponible par nonce, les NFT déjà distribués, la preuve de propriété du déposant et un mécanisme de retrait après pause selon les engagements.
- Tirage et transfert conditionnés par prix fixe, stock, quota wallet, index unique consommé une fois, preuve de règlement, fonds protégés et finalité.

**B. Mint à la demande (lazy_mint)**

- Le créateur prépare et épingle N jeux de métadonnées **uniques et validés** avant d'ouvrir la vente ; le SC ou l'opérateur ne peut créer un NFT que sur une collection vérifiée, avec permissions accordées à l'adresse du SC.
- Le SC doit disposer du rôle `ESDTRoleNFTCreate`, confirmé par interrogation de la chaîne après transaction du propriétaire de la collection, puis garder la liste des slots disponibles. Pas de rôle = transaction refusée et **aucune promesse de livraison**.
- Un slot payé peut produire un NFT de nonce distinct, mais ne peut donner un statut `delivered` qu'après finalité blockchain / transfert / propriété vérifiés. Échec mint ⇒ gestion atomique du remboursement, pas de fonds versés à l'artiste sur une livraison incertaine.

**Configuration commune** : 1 collection par distributeur, 1 devise EGLD pour V1, prix fixe exact en wei (BigInt ; jamais float), plage bornée, stock total, limite de mints par wallet, portefeuille propriétaire, commissions explicites, politique de pause, déploiement distinct et adresse/bytecode/hash contrôlés. Paramètres immuables ou modifiables uniquement avant première vente et consentement contractuel.

## Tirage auditable et risques

Le bouton de V0 exécute **seulement** un SHA-256 local avec seed contrôlé par l'utilisateur. Il montre comment éviter de choisir deux fois le même ID dans une session ; il est **manipulable** et ne doit être utilisé ni dans une vente payante ni pour revendiquer un caractère *provably fair*.

Pour le SC payant, concevoir puis auditer un engagement aléatoire non anticipable : source de hasard indépendante ou commit/reveal avec fenêtre de révélation, chaîne/domain separation, impossibilité de choisir son résultat en simulant le payable, mécanisme de timeout, remboursement si révélation impossible, épreuves contre MEV, front-running et comportements du vendeur. Tester les propriétés de non-répétition, absence de double paiement, absence d'accès après remboursement et impossibilité de manipuler les probabilités après engagement.

### Endpoints futurs — tous absents de V0

| Opération | Auth et effet | État |
|---|---|---|
| `POST /v1/art/quote` | wallet/agent mandat signé, catalogue versionné, montant maximum et TTL | NON IMPLÉMENTÉ |
| `POST /v1/art/confirm` | validation du devis, PSP test, crédit réservé idempotent | NON IMPLÉMENTÉ |
| `GET /v1/art/jobs/:id` | lecture limitée au propriétaire, coûts réels et états | NON IMPLÉMENTÉ |
| `POST /v1/art/jobs/:id/pin` | vérification média/rights, Pinata et SHA-256 | NON IMPLÉMENTÉ |
| `POST /v1/distributors/drafts` | utilisateur authentifié, vérification propriétaire/collection, pas de déploiement | NON IMPLÉMENTÉ |
| `deployDistributor` SC | wallet signé, codeHash et adresse du contrat audités | NON IMPLÉMENTÉ |
| `depositInventory` SC | wallet propriétaire, inventaire/callback, pas de transfert direct | NON IMPLÉMENTÉ |
| `buyRandom` SC | paiement exact, hasard auditable, commit atomique/remboursement | NON IMPLÉMENTÉ |

**État V0 livré en PR :** frontend, modules, traits et métadonnées papier, prix fixe déclaré, export JSON, tirage d'exemple sans fonds, tests. **Aucun smart contract, génération IA, paiement ou mint n'est actif.**

## Critères d'acceptation à prouver sur CI avant chaque activation

1. Tests Node : poids/variants, invalides, nombre borné, metadata par NFT éditable, seed reproductible, pas d'image fictive, pas d'appels payants, pas de rôle agent inféré.
2. Tests React et routes : `/create/nft-factory`, `/nft-factory`, `/distributeurs`, `/create/distributors` ; mobile 360/390/1440, accessibilité et publication réelle.
3. Provider réel : service isolé, coût connu, droits vérifiés et preuve de rendu/pin IPFS ; ledger SQL durable, réservation/rejeu/timeout/refund ; preuves Art-ID et Steward si utilisés.
4. Contrat testnet : audit Rust/SC, scénario VM multi-wallet, randomisme non anticipable, custody/retrait, rôle NFTCreate, codeHash, testnet finalisé et rollback/refund.
5. S1/S2 : chaîne paiement signé → ledger → mint NFT → livraison au buyer → My Packs ou wallet ; zéro faux NFT, pas de dispense des verrous généraux (#281, #328).
6. Revue légale : paiement aléatoire à contenu/rareté variable pouvant relever de restrictions jeux/loot boxes suivant les juridictions, droits sur les images et fiscalité des NFT.

## Liens dépôt

- Backend de préparation IA : [PR #374](https://github.com/Neltud/xArtists/pull/374), en **draft** au 5 novembre, crédits papier et aucun fournisseur réel.
- Issue génération : [#373](https://github.com/Neltud/xArtists/issues/373).
- Issue plugin registry et permissions : [#375](https://github.com/Neltud/xArtists/issues/375).
- Gates paiements/mint : [#281](https://github.com/Neltud/xArtists/issues/281).
- Stockage média, droits et signatures wallet : `services/access-api/src/creatorMedia.mjs` et `apps/frontend/src/hooks/useStudioMintTx.ts`.

Référence officielle MultiversX : https://docs.multiversx.com/tokens/nft-tokens/ et https://docs.multiversx.com/developers/developer-reference/sc-api-functions/ .

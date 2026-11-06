# xArtists — Creator Studio : importer JPG/PNG/WebP/MP4 et minter sur MultiversX

**Sprint du 2 novembre 2026 · feature d'upload IPFS désactivée par défaut · signature et frais payés uniquement par le wallet personnel de l'artiste.**

## Parcours

1. Studio /studio : choisir une collection NFT existante ou émettre une nouvelle collection avec son propre xPortal, puis obtenir le rôle ESDTRoleNFTCreate.
2. Sélectionner une image JPEG/PNG/WebP (maximum 16 MiB) ou une vidéo MP4 (maximum 48 MiB). L'interface affiche un aperçu local avant publication.
3. Fournir un titre, une description et attester disposer des droits de publier le média. Un fichier local **n'est pas** un NFT : la publication doit être confirmée.
4. Lorsque le service est activé, signer un **challenge SIWX dédié au Creator Studio** (distinct des signatures TCA et RWA). Le serveur émet une session courte (15 min) portant `purpose=studio_media`.
5. Le navigateur transmet le fichier binaire au backend xArtists via HTTPS. Le backend vérifie taille, Content-Length, empreinte du format (magic bytes), quota journalier par wallet et identité signée. La clé Pinata reste côté backend.
6. Pinata épingle le média public dans IPFS avec un **répertoire conservant l'extension** (ex. `ipfs://CID/artwork-hash.mp4`), compatible avec l'indexeur NFT MultiversX. Le serveur stocke uniquement empreinte, wallet, type, taille, CID et état dans PostgreSQL ; les originaux média sont hébergés chez Pinata / IPFS, pas dans PostgreSQL.
7. Le backend épingle ensuite un JSON public de métadonnées `image` ou `animation_url` selon le type, l'empreinte SHA-256 et le wallet artiste. Le Studio reçoit l'attribut `metadata:CID;tags:xartists,studio`.
8. L'artiste vérifie URI, média, collection, rôle et frais. Il signe **ESDTNFTCreate** lui-même via xPortal. L'API ne diffuse aucune transaction et n'a accès à aucune clé privée.
9. Attendre le succès de la transaction sur MultiversX Explorer et vérifier le token émis. Un upload IPFS ou un identifiant de session ne prouve pas le mint.

## Configuration de l'API (Render ou backend équivalent, secrets **serveur uniquement**)

| Variable | Rôle |
| --- | --- |
| `CREATOR_MEDIA_UPLOAD_ENABLED=1` | Activation volontaire après contrôles de sécurité, coûts et hébergement |
| `PINATA_JWT` | Clé Pinata dédiée, droits d'upload minimaux (jamais exposée en `VITE_...`) |
| `DATABASE_URL` | PostgreSQL durable (Neon existant ou autre instance autorisée) |
| `ACCESS_JWT_SECRET` | Secret SIWX/JWT backend actuel ; sessions `studio_media` 15 minutes |
| `CORS_ORIGIN=https://neltud.github.io` | Origine autorisée GitHub Pages |
| `PGSSL=0` | Seulement local ; TLS en production |

Aucun secret n'est ajouté au dépôt, aucune variable distante n'a été modifiée par cette PR.

### API

| Route | Description |
| --- | --- |
| `GET /v1/studio/media/config` | Vérification du feature flag sans révéler la clé Pinata |
| `POST /v1/studio/media/challenge` | Challenge artiste SIWX dédié |
| `POST /v1/studio/media/session` | Signature valide → token `purpose=studio_media` 15 min |
| `POST /v1/studio/media/upload` | Fichier binaire JPEG/PNG/WebP/MP4 (avec Authorization Bearer) → Pinata, IPFS URI |
| `POST /v1/studio/media/metadata` | Vérifie le propriétaire du média et son attestation de droits ; retourne métadonnées IPFS |

Prérequis obligatoire avant toute activation : exécuter et vérifier les migrations SQL 004 puis 005 sur la **base Render effectivement utilisée**, sous approbation opérateur. Sans schéma, le service échoue en mode fermé ; ne pas appliquer ces migrations par supposition à un sandbox Neon non confirmé.

Journal et quota dans `xartists_studio_media` : maximum 8 uploads par wallet sur 24 heures. Les réservations échouées comptent dans le quota pour prévenir les abus ; une reprise/expurge nécessite un opérateur humain. Le module reste désactivé sans base SQL persistante.

### Prévention des métadonnées contradictoires (6 novembre 2026)

- La première publication de métadonnées réserve le média en statut `metadata_pinning` **avant** l'appel Pinata, pour empêcher deux requêtes simultanées de créer deux JSON concurrents.
- Lors de l'enregistrement final, le serveur conserve `metadata_sha256`, une empreinte des champs exacts du JSON publié (titre, description, URI, wallet, hash), ainsi que `metadata_uri`. Un retry identique retourne le CID existant ; un retry avec contenu différent renvoie HTTP 409 `metadata_immutable_request_mismatch`. Il faut préparer un **nouvel upload** pour un JSON différent ; on n'annonce jamais l'ancien CID comme s'il contenait le nouveau titre.
- La colonne `metadata_sha256` et le statut `metadata_pinning` nécessitent la migration opérateur **`services/access-api/migrations/005_creator_media_metadata_idempotency.sql`**, après la migration 004. L'ancienne contrainte SQL (004) n'autorise pas `metadata_pinning` : **sans 005, l'upload échoue**. Le backend n'exécute plus de DDL lors des uploads : aucune création ou altération silencieuse de table par le wallet.
- En cas de **réponse Pinata définitivement négative** (HTTP non-2xx), la réservation de métadonnées revient à `pinned` pour permettre une reprise. Le quota initial du média reste compté.
- En cas de **réponse Pinata incertaine** (timeout, erreur réseau, réponse HTTP 2xx illisible, échec d'enregistrement PostgreSQL), le serveur répond `metadata_pin_result_unknown_reconcile` (503) et **conserve `metadata_pinning`**. Les octets JSON ont pu être publiés même si le serveur n'a reçu aucun CID exploitable. Les retries automatiques sont interdits : l'artiste voit un avertissement et le bouton d'upload est désarmé pour le fichier actif.
- L'opérateur doit consulter la référence d'upload, les pins Pinata et la base PostgreSQL **par les outils sécurisés**, vérifier le CID et l'empreinte du JSON réellement publié, puis décider séparément de l'enregistrement conforme, d'une reprise prouvée sûre ou d'une intervention manuelle. Ne jamais inventer de CID, débloquer arbitrairement un statut ni désactiver la limite de quota. Une interruption du processus peut laisser `metadata_pinning` même sans HTTP visible ; elle suit la même procédure.
- Si le service perd ses droits PostgreSQL pendant la publication, vérifier la connexion à la bonne base avant toute réconciliation. Aucune migration n'est déclenchée par une requête artiste.
- L'interface invalide une publication en cours dès que l'artiste change de fichier, de wallet, de titre, de description ou d'attestation de droits. Une requête Pinata déjà expédiée peut néanmoins avoir consommé du stockage/quota ; aucune fin de tâche obsolète ne doit armer le bouton de mint avec les anciennes métadonnées.

**Préflight avant activation :** vérifier la cible PostgreSQL réelle et la colonne SQL, l'identité et les quotas du compte Pinata, le JWT minimal serveur avec `GET https://api.pinata.cloud/data/testAuthentication` depuis l'opérateur serveur, les limites du plan, le CORS, puis un upload et un JSON contrôlés sur un wallet de recette. Le chemin `pinFileToIPFS` / `pinJSONToIPFS` est l'API historique Pinata toujours documentée ; une migration vers V3 est un chantier distinct.

### Formats, droits et disponibilité

- JPEG / PNG / WebP 16 MiB, MP4 48 MiB. La détection inspecte les **octets**, pas seulement l'extension du fichier. Les vidéos doivent être réellement encodées en MP4 ; le simple fichier `*.mp4` ne suffit pas.
- Publication **publique et potentiellement persistante** sur IPFS : ne jamais uploader des scans d'identité, adresses de livraison, secrets ou œuvres sans droits. Une signature de connexion n'est pas un consentement d'exploitation commerciale : la case de droits est obligatoire.
- Métadonnées immuables une fois le CID créé ; modifier les infos suppose un nouveau CID et potentiellement une mise à jour on-chain selon les rôles.
- Pinata peut avoir des quotas / frais ; consulter son compte et sa politique de stockage avant activation. Un CID IPFS nécessite une politique de pinning, de sauvegarde et de disponibilité à long terme.
- MultiversX recommande l'image/vidéo à 64 Mo maximum pour la création de miniatures. La limite Studio de 48 MiB MP4 reste volontairement plus basse.
- Les artistes dont le backend n'est pas configuré peuvent **continuer à utiliser une URI externe IPFS/HTTPS durable déjà publiée**, sans prétendre qu'un fichier local est uploadé.

## Marketplace V3

Le parcours public distingue désormais trois rayons :

- **Art numérique** : créations d'artistes (images, MP4 NFT) ; recherche, tri et listings indexés par le backend quand disponible. Aucun achat automatique, aucune offre inventée et aucune donnée fictive déguisée en live.
- **Œuvres physiques** : attestation de provenance, chaîne de garde xArtists, Shopify seulement après activation du marchand. Réception signée et litiges distincts du NFT.
- **Packs IA** : Pulse, Yield et Sentinel, droits d'accès différents des NFT d'artistes.

**Etsy :** le règlement officiel au 5 octobre 2026 interdit formellement la vente de NFT. Il est possible d'étudier des fiches **d'œuvres physiques originales** éligibles, avec photos réelles, prix, stocks, transport et origine ; **jamais présenter un NFT à vendre sur Etsy, ni orienter un acheteur Etsy vers un paiement externe**. Aucune publication Etsy n'est automatisée par cette PR.

Sources : https://www.etsy.com/legal/policy/non-fungible-tokens-nfts-policy/1114711452112 · https://www.etsy.com/legal/creativity/ · https://docs.multiversx.com/tokens/nft-tokens/ · https://github.com/PinataCloud/docs/blob/main/pinata-api-ipfs.yaml

## Tests et gates de mise en service

1. `services/access-api` : `npm ci --ignore-scripts`, `npm test` ; suite de tests MIME/magic, JWT purpose, quota/config fail-closed, droits et métadonnées.
2. `apps/frontend` : `npm ci --legacy-peer-deps --ignore-scripts`, `npm run build` ; vérification des erreurs de types spécifiques aux fichiers ajoutés. Le typecheck global est traité séparément dans l'issue #271.
3. En recette : wallet xPortal test, publication de médias légitimes, validité du CID et des metadata sur IPFS, vidéo lisible, NFT mainnet minté par l'artiste puis effectivement indexé sur Explorer.
4. En production : surveillance du quota, coûts Pinata et SQL, rate limiting anti-abus persistant, remontée d'erreurs, conformité RGPD/PI et responsabilité des œuvres, procédure de retrait des contenus pirates et revue de sécurité.
5. Ne pas annoncer « upload de vidéo NFT live » sans clé backend réellement configurée, upload indépendant réussi, et preuve de mint de transaction.

**Issue #271 (tech debt) :** verrouiller `services/access-api/package-lock.json` pour `npm ci` puis résorber les erreurs TypeScript globales. Ce sprint ne les camoufle pas.

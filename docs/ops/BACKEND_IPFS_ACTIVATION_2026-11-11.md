# Activation backend Creator Studio / IPFS — xArtists

**Actualisé le 12 novembre 2026 — runbook de préparation, pas une autorisation implicite à basculer en production.** Le SHA public courant se vérifie toujours sur [build-info.json](https://xartists.art/build-info.json). L'état exact de la base qui sert l'API, de Pinata et du consentement d'un artiste **n'est pas certifié par ce document**.

## Conditions bloquantes (fail-closed)

1. Confirmer **le workspace Render et le service API effectivement relié à** `https://xartists-access-api.onrender.com`. Ne pas déployer une autre app portant un nom similaire. Consulter le commit et les derniers logs, vérifier `GET /health` et `GET /v1/studio/media/config`.
2. Vérifier la connexion au PostgreSQL **de ce service** par outil opérateur privé ; contrôler la table `public.xartists_studio_media`, index quota `xartists_studio_media_wallet_created_idx`, colonne `metadata_sha256` et contrainte de statut `metadata_pinning` issus des migrations **004 puis 005**, et **006** si GLB doit être autorisé. Ne rien migrer sur un sandbox inconnu.
3. Confirmer que `PINATA_JWT` est une clé serveur de périmètre minimal qui répond à `GET /data/testAuthentication`, avec limites de stockage/coût, suivi des quotas et gestion de révocation. **Jamais** `VITE_PINATA_JWT` ni clé en issue/log.
4. Confirmer `ACCESS_JWT_SECRET` robuste et privé, `DATABASE_URL` en TLS, domaine CORS autorisé `https://xartists.art` (et origine `https://www.xartists.art` seulement si utilisée), quotas anti-abus et authentification SIWX/xPortal. Un statut de connexion xPortal ne prouve pas la signature d'un challenge.
5. Exécuter depuis le **contexte sécurisé du serveur confirmé** `node scripts/check-studio-ipfs.mjs` (ou `npm run check:studio:ipfs` si script déclaré), en lecture seule : résultat attendu `ok: true` pour DB + Pinata + signature. Réexécuter la CI locale `services/access-api/tests/creator-media*.test.mjs`.
6. Seulement ensuite, activer volontairement **`CREATOR_MEDIA_UPLOAD_ENABLED=1`**, avec journal d'audit et surveillance. Conserver **`STUDIO_GLB_UPLOAD_ENABLED=0`** jusqu'au contrôle séparé du GLB, de son poster, des ressources intégrées et des limites par wallet.
7. Réaliser un upload **consenti d'une petite œuvre de recette** avec wallet artiste non privilégié, vérifier le SHA des octets et CID, le JSON immuable, la reprise après timeout et le contrôle sur deux gateways. N'annoncer un NFT qu'après transaction de mint **signée par le propriétaire** et statut `success` sur Explorer.
8. Déployer/activer les snapshots de statut sans divulguer d'environnement ni d'IDs de fichiers Drive. Tenir le journal de remboursement/recouvrement séparé des uploads : aucun `PayBox`, Stripe ou trading autonome ne doit être ouvert par cette bascule.

## Éléments déjà présents dans le dépôt

- `services/access-api/src/studioPreflight.mjs` : contrôle en lecture seule de la table, index, statuts, JWT et Pinata (sans afficher les secrets).
- `services/access-api/src/creatorMedia.mjs` : validation média JPG/PNG/WebP/MP4/GLB, Pinata, quotas par wallet, métadonnées immuables et protection contre les retries ambigus.
- `services/access-api/migrations/004_creator_media_pinata.sql`, `005_creator_media_metadata_idempotency.sql` et `006_creator_media_glb.sql` : migrations devant être appliquées uniquement à la base vérifiée.
- `apps/frontend/src/components/CreatorMediaUpload.tsx` : état d'upload obtenu à l'exécution depuis `/v1/studio/media/config`, interdisant l'envoi tant que le backend est OFF.
- `docs/CREATOR_MEDIA_UPLOAD_IPFS.md` : protocole IPFS, réconciliation des CIDs, double pin, test de restauration.

## Sortie de recette

`publicUploadEnabled` (booléen), `modelEnabled` (booléen), état DB/Pinata/JWT (sans valeurs), domaine et date de test, SHA backend, CIDs d'une œuvre autorisée, hash de la TX signée et état on-chain. **Un GO backend n'autorise pas un GO commerce ni un GO mint automatique.**

Les médias du dossier Drive historique restent privés jusqu'à une sélection œuvre par œuvre et une licence/licéité documentée. La dApp ne doit pas aspirer des Drive partagés avec un service account sans consentement des titulaires.

## Diagnostic P0 du 12 novembre — identifier la vraie cause du 503

La base PostgreSQL **hébergée par Render** est absente du workspace observé ; l'API Render annonce `orders_backend=postgres`, donc son stockage est externe. La sandbox Neon `xartists-access-sandbox`, interrogée en **SELECT seulement** le 12 novembre, possède `paybox_orders` mais **pas** `public.xartists_studio_media`. **Aucune preuve ne lie cette sandbox à la base réellement connectée à Render ; ne pas appliquer de migration dans cette sandbox par supposition.**

Après déploiement du code de diagnostic (`studioStoreProbe.mjs`), une lecture de `GET /v1/ops/studio-store/status` déclenche au maximum un journal par changement d'état sur le backend réel, sous la forme : `[xArtists studio-store] backend=postgres reason=<code>`. Les seuls codes permis sont `verified`, `database_url_missing`, `migration_004_missing`, `migration_006_missing`, `studio_schema_incomplete` et `database_probe_failed`. **Ne jamais journaliser ni publier** l'URL PostgreSQL, les requêtes, les erreurs `pg`, les adresses de wallet ni les CIDs.

- `migration_004_missing` : la table Studio manque dans **la base de l'API**, pas nécessairement dans toutes les bases Neon. Exiger l'identification de la DB et un backup restauré avant d'envisager 004 → 005 → 006.
- `studio_schema_incomplete` : lire les colonnes et contraintes en métadonnées seulement ; conserver uploads OFF, vérifier précisément l'index quota et la contrainte de statut.
- `migration_006_missing` : **GLB seulement** après les recettes image/vidéo et les étapes de stockage ; ne pas activer le modèle pour contourner le diagnostic.
- `database_probe_failed` : distinguer, depuis le service privé, TLS/confiance CA, connectivité et accès SQL **sans imprimer** de DSN. Pas de `PGSSL=0` en production ni désactivation des vérifications TLS.
- `verified` : le schéma **seul** est prêt. Cela ne certifie ni Pinata, ni durabilité IPFS, ni droits sur l'œuvre, ni mint ou vente.

L'endpoint public garde son **format booléen**, `503` quand non prêt, `Cache-Control: no-store` : aucune cause privée n'est exposée au navigateur. Des tests garantissent que le diagnostic reste borné, sans secrets, et que le journal ne peut ni faire échouer la vérification ni autoriser une opération.

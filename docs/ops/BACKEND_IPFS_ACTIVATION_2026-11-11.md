# Activation backend Creator Studio / IPFS — xArtists

**11 novembre 2026 — runbook de préparation, pas une autorisation implicite à basculer en production.** Le frontend `xartists.art` est déployé depuis `969b3a96c38aba5a1ab596535490f097079e3c8e`. L'état actif de Render, de Pinata et de la base qui sert l'API **n'a pas été certifié par ce document**.

## Conditions bloquantes (fail-closed)

1. Confirmer **le workspace Render et le service API effectivement relié à** `https://xartists-access-api.onrender.com`. Ne pas déployer une autre app portant un nom similaire. Consulter le commit et les derniers logs, vérifier `GET /health` et `GET /v1/studio/media/config`.
2. Vérifier la connexion au PostgreSQL **de ce service** par outil opérateur privé ; contrôler la table `public.xartists_studio_media`, index quota `xartists_studio_media_wallet_created_idx`, colonne `metadata_sha256` et contrainte de statut `metadata_pinning` issus des migrations **004 puis 005**. Ne rien migrer sur un sandbox inconnu.
3. Confirmer que `PINATA_JWT` est une clé serveur de périmètre minimal qui répond à `GET /data/testAuthentication`, avec limites de stockage/coût, suivi des quotas et gestion de révocation. **Jamais** `VITE_PINATA_JWT` ni clé en issue/log.
4. Confirmer `ACCESS_JWT_SECRET` robuste et privé, `DATABASE_URL` en TLS, domaine CORS autorisé `https://xartists.art` (et origine `https://www.xartists.art` seulement si utilisée), quotas anti-abus et authentification SIWX/xPortal. Un statut de connexion xPortal ne prouve pas la signature d'un challenge.
5. Exécuter depuis le **contexte sécurisé du serveur confirmé** `node scripts/check-studio-ipfs.mjs` (ou `npm run check:studio:ipfs` si script déclaré), en lecture seule : résultat attendu `ok: true` pour DB + Pinata + signature. Réexécuter la CI locale `services/access-api/tests/creator-media*.test.mjs`.
6. Seulement ensuite, activer volontairement **`CREATOR_MEDIA_UPLOAD_ENABLED=1`**, avec journal d'audit et surveillance. Conserver **`STUDIO_GLB_UPLOAD_ENABLED=0`** jusqu'au contrôle séparé du GLB, de son poster, des ressources intégrées et des limites par wallet.
7. Réaliser un upload **consenti d'une petite œuvre de recette** avec wallet artiste non privilégié, vérifier le SHA des octets et CID, le JSON immuable, la reprise après timeout et le contrôle sur deux gateways. N'annoncer un NFT qu'après transaction de mint **signée par le propriétaire** et statut `success` sur Explorer.
8. Déployer/activer les snapshots de statut sans divulguer d'environnement ni d'IDs de fichiers Drive. Tenir le journal de remboursement/recouvrement séparé des uploads : aucun `PayBox`, Stripe ou trading autonome ne doit être ouvert par cette bascule.

## Éléments déjà présents dans le dépôt

- `services/access-api/src/studioPreflight.mjs` : contrôle en lecture seule de la table, index, statuts, JWT et Pinata (sans afficher les secrets).
- `services/access-api/src/creatorMedia.mjs` : validation média JPG/PNG/WebP/MP4/GLB, Pinata, quotas par wallet, métadonnées immuables et protection contre les retries ambigus.
- `services/access-api/migrations/004_creator_media_pinata.sql` et `005_creator_media_metadata_idempotency.sql` : migrations devant être appliquées uniquement à la base vérifiée.
- `apps/frontend/src/components/CreatorMediaUpload.tsx` : état d'upload obtenu à l'exécution depuis `/v1/studio/media/config`, interdisant l'envoi tant que le backend est OFF.
- `docs/CREATOR_MEDIA_UPLOAD_IPFS.md` : protocole IPFS, réconciliation des CIDs, double pin, test de restauration.

## Sortie de recette

`publicUploadEnabled` (booléen), `modelEnabled` (booléen), état DB/Pinata/JWT (sans valeurs), domaine et date de test, SHA backend, CIDs d'une œuvre autorisée, hash de la TX signée et état on-chain. **Un GO backend n'autorise pas un GO commerce ni un GO mint automatique.**

Les médias du dossier Drive historique restent privés jusqu'à une sélection œuvre par œuvre et une licence/licéité documentée. La dApp ne doit pas aspirer des Drive partagés avec un service account sans consentement des titulaires.

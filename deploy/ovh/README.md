# OVH — standalone xArtists Access API (parallel / NO-GO commerce)

This deploy is a **portable API package**, not a claim that the user's OVH server, DNS,
email, account database, Pinata or checkout are configured. It leaves GitHub Pages
and the current Render API untouched until a separate, proven cutover.

## Architecture

- **GitHub Pages** keeps the public dapp while the backend is moved.
- **OVH** runs the existing Node Access API behind Caddy HTTPS (port 8787 is
  private to Docker). Persistent HTTPS certificate state uses named volumes.
- The image also includes the bounded read-only Python xOrus analysis worker.
  Compose builds from the repository root so it includes the shared contract and
  Python sources. A manual equivalent is `docker build -f services/access-api/Dockerfile .`
  from the repository root. Set `XORUS_ANALYSIS_ENABLED=0` to disable collection.
- **PostgreSQL** stays on the already-identified, *verified* database during the
  first cutover. Do not confuse Neon sandbox projects with the production DB or
  migrate data without a tested restore.
- **Akash** may later run stateless xOrus/3D batch workers. Do not attach customer
  accounts, wallet signing or the only database to an expiring Akash lease.

## Operator preflight

1. Confirm OVH server ownership and access, x86_64/aarch64 Docker Engine +
   Compose v2, firewall for ports 80/443, and a DNS host under your control.
   Use a **staging host** first; do not point the public frontend at it yet.
2. Copy `api.env.template` to `.env.api` **on the server only**. Set
   `DATABASE_URL` to the confirmed API database after validating TLS,
   backups, user privileges and data retention; set a strong server-only
   `ACCESS_JWT_SECRET`. Do not print credentials or copy the Render URL blindly.
3. Keep all compose-injected financial and mint flags at `0`. The sample file
   is deliberately noncommercial. Do not mount wallets, PEMs or seeds.
4. Set `API_HOSTNAME` to the exact staging DNS host (no scheme or path).
   Then run the commands below from `deploy/ovh/`.

```bash
cp api.env.template .env.api
# Edit .env.api privately on the server; the template has no secrets.
export API_HOSTNAME=api-staging.example.org   # replace with YOUR actual DNS host
docker compose config --quiet
docker compose up -d --build
docker compose ps
curl --fail-with-body "https://$API_HOSTNAME/health"
# A 503 here is an expected NO-GO if the schema is not ready:
curl -i "https://$API_HOSTNAME/v1/ops/studio-store/status"
```

The `/health` response proves only that the process is responding. A
PostgreSQL `orders_backend` label alone does not certify the database identity,
order reconciliation or NFT delivery. The Studio endpoint reports only schema
readiness, not upload approval.

`GET /v1/ops/build-info` exposes the exact code SHA reported by the host, separately
from GitHub Pages. On this operator-managed deployment, set `XARTISTS_SOURCE_SHA`
to the actual checkout SHA before building and starting the image. Render uses
its own `RENDER_GIT_COMMIT`. Missing, malformed or conflicting metadata returns
503 and `source_sha:null`. The `started_at` value is process startup, not build
time; this identity never certifies database readiness, financial authorization
or source truth. `/health.source_sha` uses the same immutable process identity.

## Validation and production cutover

- Match the configured API database to independent operator evidence;
  verify database migration versions 004/005/006 and SELECT-only schema probes.
- Test backups by restoring to a disposable database, then apply migrations
  separately with an authorized operator. **Compose startup never migrates.**
- Test SIWX challenge, wallet change and expired JWT; verify XPortal on a
  real browser and confirm Reown exact-origin allowlist. Test account login
  only after the approved auth service and DB mapping exist.
- Run API tests, CORS checks from `https://xartists.art`, mobile/desktop
  browser tests, and wallet/fiat rejection paths. Verify no checkout, mint,
  bridge, auction settlement or LIA trading can execute from staging.
- Set the GitHub Pages variable `VITE_ACCESS_API_BASE=https://api.xartists.art` **only after** an operator-approved
  cutover and a proven rollback URL. Pages now ignores any Render or unknown URL and leaves the API unconfigured rather than silently falling back. Observe errors, order idempotency, and
  signed request behavior. Revert the frontend API base if verification fails;
  leave Render running through the validation window.
- Caddy TLS requires functioning DNS and inbound 80/443; no OVH console or
  registrar changes are made by this repository.

## Stop conditions

Missing valid DNS/HTTPS, unknown database identity, ineffective backup,
auth failures, unexpected non-readonly capability, leakage of credentials,
or a failed wallet/order regression = **NO-GO**. Never report sales or
NFT delivery as live merely because the API health check is green.

## Studio image / video / music: opt-in after database validation

The public file picker and local previews do **not** require a wallet. Real IPFS publication still requires an artist-owned xPortal signature, rights confirmation, server quota, TLS, the exact verified PostgreSQL database, and server-side Pinata credentials. This deployment does not accept anonymous uploads or automatically mint NFTs.

1. Keep `XARTISTS_STUDIO_UPLOAD_APPROVED` **unset** (Compose defaults to `0`). The existing `.env.api` includes `CREATOR_MEDIA_UPLOAD_ENABLED=0`, and Compose intentionally overrides it with this separate operator-only switch.
2. Identify the **actual** API database with a read-only probe, encrypted backup and verified restore. Apply reviewed SQL migrations **004, 005, 006, then 007 (audio MIME)** on that database only. Never run migrations automatically at startup or against an unknown Neon project.
3. On the server, run `node services/access-api/scripts/check-studio-ipfs.mjs` from the confirmed runtime with its validated secrets; require `ok:true` for schema, JWT and Pinata. Review CORS `https://xartists.art`, xPortal signed challenge/session and exact SHA before any opt-in.
4. Only after every prerequisite is independently proven, explicitly set `XARTISTS_STUDIO_UPLOAD_APPROVED=1` in the **operator-managed deployment environment** and recreate the API container. Do not put that switch or secrets into GitHub Pages variables. `STUDIO_GLB_UPLOAD_ENABLED` remains `0` and payments/mint/trading remain OFF.
5. Verify `GET https://api.xartists.art/v1/studio/media/config` returns `enabled:true` only with complete production readiness. With an authorized small media file, test signed upload, returned CID/SHA-256, metadata, independent retrieval and backup/restore; no real NFT mint without a separate signed transaction and verification.
6. For any failed readiness check, unset the opt-in and recreate the API. Never interpret HTTP 200 on `/health`, green CI, or a local preview as proof that an upload occurred.

**Operator-only requirement:** The actual server's Docker context, DNS/certificate, PostgreSQL identity and secret values cannot be verified or changed from Git commits alone. Keep public upload NO-GO until those are independently observed.

## Option autonome : Kubo IPFS local, sans stockage Pinata obligatoire

`deploy/ovh/compose.ipfs.yaml` est une **surcouche optionnelle** au déploiement OVH.
Kubo reçoit les médias sous un réseau Docker dédié `ipfs_rpc` accessible à
l'API, sans port 5001/8080 publié sur l'hôte. La gateway publique et l'accès
indépendant aux CIDs ne sont pas garantis par ce seul nœud. Aucun fichier client
n'est importé au démarrage.

Sur le serveur contrôlé par l'opérateur (et **après** identification de la bonne
base PostgreSQL, sauvegarde/restauration et migrations 004→005→006→007) :

```bash
# Digest exact d'une image Kubo stable vérifiée par l'opérateur, jamais :latest.
export XARTISTS_KUBO_IMAGE='ipfs/kubo@sha256:<digest-reel-64-hex>'
# Répertoire hors dépôt, sur volume persistant sauvegardé avec restauration testée.
export XARTISTS_KUBO_DATA_DIR='/chemin/prive/vers/ipfs'
export API_HOSTNAME='api-staging.xartists.art'
# L'upload doit rester OFF au premier lancement.
unset XARTISTS_STUDIO_UPLOAD_APPROVED
docker compose -f deploy/ovh/compose.yaml -f deploy/ovh/compose.ipfs.yaml config --quiet
docker compose -f deploy/ovh/compose.yaml -f deploy/ovh/compose.ipfs.yaml up -d --build
docker compose -f deploy/ovh/compose.yaml -f deploy/ovh/compose.ipfs.yaml \
  exec -T api node scripts/check-studio-ipfs.mjs
```

Le chemin d'upload Kubo valide l'empreinte SHA-256 par relecture **locale** des octets via le RPC privé après chaque ajout du fichier et des métadonnées. Cela ne prouve toujours pas la récupération par une passerelle indépendante ni la sauvegarde.

La commande de vérification ne fait **aucun upload** : elle interroge les
métadonnées du schéma en lecture seule et le RPC privé `/api/v0/version`.
Même un retour `ok:true` n'autorise pas le public : l'opérateur doit encore
vérifier la preuve de contrôle xPortal, les droits, le CID, la reprise après
coupure, l'indexation et l'accès depuis deux systèmes indépendants, et
répliquer les données hors serveur. L'absence de port P2P publié dans cette
surcouche interdit de présumer une disponibilité IPFS mondiale ; examiner
pare-feu et publication P2P séparément sans exposer le RPC admin.

**Bascule distincte :** seulement après ces preuves, l'opérateur peut mettre
`XARTISTS_STUDIO_UPLOAD_APPROVED=1` dans l'environnement privé de déploiement
et recréer le service, puis répéter le préflight et une publication de recette
signée. Toute perte de stockage ou erreur de schéma impose retour à `0`.
Les paiements, la vente, le mint automatique, les clés privées de wallet et le
trading restent désactivés indépendamment.

Mode Pinata historique : sans `compose.ipfs.yaml`, `STUDIO_IPFS_PROVIDER`
reste `pinata` par défaut et nécessite un JWT serveur. Aucun repli automatique
de Kubo vers Pinata ne survient si le nœud autonome est indisponible.

---
hidden: true
noIndex: true
---

# Runbook — déblocage PostgreSQL Studio (004 → 006)

Date : 15 novembre 2026. Fail-closed. **Ce document n’active aucun upload, mint ni paiement.**

## Objectif

Faire passer la sonde publique
`GET /v1/ops/studio-store/status` de

```json
{"ok":false,"backend":"postgres","table_ready":false,"schema_ready":false,"model_schema_ready":false}
```

à un état où `table_ready` et `schema_ready` sont vrais pour le chemin image/vidéo (004+005). `model_schema_ready` ne devient vrai qu’après 006 **et** seulement si le produit exige le GLB.

Pendant toute la procédure : `CREATOR_MEDIA_UPLOAD_ENABLED=0` (ou équivalent `studio_media_upload=off`).

## Prérequis

1. Accès opérateur au service Render de l’API (variables d’environnement), **sans coller l’URL dans un ticket, un commit ou un chat**.
2. Confirmation que la `DATABASE_URL` de l’API est bien celle sur laquelle on travaille (pas un Neon sandbox « orphelin »).
3. Outil `psql` (ou client SQL équivalent) en lecture/écriture contrôlée.
4. Capacité de **backup logique** (pg_dump) et de restore testée sur une **copie**.

## Étape 0 — Identifier la base (sans fuite)

Sur le dashboard Render du service access-api :

- Noter l’hôte (hostname seulement) et le nom de base, **pas** le mot de passe.
- Vérifier qu’un seul service de production pointe dessus.

Critère d’arrêt si doute : **ne pas migrer**.

## Étape 1 — Backup

```text
pg_dump --format=custom --no-owner --file=studio-pre-004-$(date -u +%Y%m%dT%H%M%SZ).dump "$DATABASE_URL"
```

- Stocker le dump hors du dépôt Git.
- Vérifier la taille > 0 et qu’un `pg_restore --list` lit le catalogue.
- **Critère GO :** restore dry-run ou restore sur une instance jetable réussit.

## Étape 2 — État avant SQL (lecture seule)

Sur la base cible :

```sql
SELECT to_regclass('public.xartists_studio_media') AS media_table;
SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='xartists_studio_media'
  ORDER BY ordinal_position;
```

Interprétation :

| Résultat | Action |
| --- | --- |
| media_table NULL | Appliquer 004 puis 005 (puis 006 si GLB) |
| table présente, colonnes incomplètes | Appliquer seulement les migrations manquantes |
| table complète + contraintes 004/005 | Ne pas rejouer ; vérifier la sonde HTTP |

Ne jamais `SELECT` de lignes wallet / uri / sha256 dans un log partagé.

## Étape 3 — Migration 004

Fichier : `services/access-api/migrations/004_creator_media_pinata.sql`

- Crée `xartists_studio_media` (id, wallet, mime image/vidéo, bytes, sha256, uri, status reserved|pinned|failed, created_at, metadata_uri).
- Index `(wallet, created_at DESC)`.

Après application :

```sql
SELECT to_regclass('public.xartists_studio_media') AS media_table;
SELECT indexname FROM pg_indexes WHERE tablename = 'xartists_studio_media';
```

**Critère GO :** table + index présents. Upload toujours OFF.

## Étape 4 — Migration 005

Fichier : `services/access-api/migrations/005_creator_media_metadata_idempotency.sql`

Prérequis : 004 appliquée.

- Colonne `metadata_sha256`.
- Contrainte status inclut `metadata_pinning`.

Vérification sûre (pas de CID / wallet) :

```sql
SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='xartists_studio_media'
  AND column_name='metadata_sha256';
SELECT pg_get_constraintdef(oid) FROM pg_constraint
  WHERE conrelid='public.xartists_studio_media'::regclass
    AND conname='xartists_studio_media_status_check';
```

**Critère GO :** colonne + contrainte status à quatre valeurs.

## Étape 5 — Migration 006 (optionnelle, GLB)

Fichier : `services/access-api/migrations/006_creator_media_glb.sql`

Prérequis : 004 + 005 + backup.

- MIME `model/gltf-binary`.
- Plafond 32 Mio pour les GLB.

Sans besoin produit GLB immédiat, **reporter 006**. Les images/vidéo n’exigent pas 006.

## Étape 6 — Relecture sonde publique

```text
GET https://xartists-access-api.onrender.com/v1/ops/studio-store/status
```

Attendu après 004+005 (sans flag upload) :

- HTTP **200** ou **503** selon le code HTTP du service, mais `ok` / `schema_ready` / `table_ready` doivent refléter le schéma réel (si le code mappe ready=true → ok true).
- `backend` reste `postgres`.
- `GET /v1/studio/media/config` → `enabled=false`.

Si `table_ready` reste false : logs opérateur (reason codes fixes : migration_004_missing, studio_schema_incomplete, database_probe_failed). Corriger avant toute activation.

## Étape 7 — Ce qu’on ne fait **pas** dans ce runbook

- `CREATOR_MEDIA_UPLOAD_ENABLED=1`
- mint live, OIDC dispatch, PayBox checkout
- Pinata JWT dans le frontend
- Migration sur une base non liée à Render prod
- Bascule DNS OVH

## Étape 8 — Après schéma vert

Ordre métier inchangé :

1. Preuve xPortal / Reown (#506)
2. Cycle listing → achat → receipt (#428)
3. Un seul rail paiement après webhooks
4. Upload : un pin test → CID → readback → seulement alors le drapeau upload

## Références code

- `services/access-api/src/studioStoreProbe.mjs`
- `services/access-api/src/studioPreflight.mjs`
- `services/access-api/migrations/004_creator_media_pinata.sql`
- `services/access-api/migrations/005_creator_media_metadata_idempotency.sql`
- `services/access-api/migrations/006_creator_media_glb.sql`
- Tests : `studioStoreProbe.test.mjs`, `studio-preflight.test.mjs` (PR #594)

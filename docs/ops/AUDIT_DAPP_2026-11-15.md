---
hidden: true
noIndex: true
---

# Audit dApp xArtists — 15 novembre 2026 (~10:50 UTC)

Audit de production en lecture seule. Aucun drapeau, aucune migration, aucune signature.

## 1. Verdict global

| Couche | Verdict | Preuve |
| --- | --- | --- |
| Site public (Pages) | **GO** | 0.139.0, 140 routes, trading faux |
| API health | **GO service / NO-GO commerce** | ok=true, tous rails payants / mint live off |
| Studio data plane | **NO-GO** | 503, table_ready=false |
| Upload média | **OFF** | config enabled=false |
| Mint live | **NO-GO** | dry_run, live false |
| Fiat | **NO-GO** | Stripe/MoonPay off ; PayBox checkout false |
| Trading LIA | **NO-GO** | lia_live_trading=0 / false |
| Alignement Pages ↔ API | **ÉCART** | Pages `7b280cc` vs API `8b6fae84` |

**Position :** vitrine artistique live. Commerce, mint et Studio upload non ouverts. Un « go-live total » commercial reste une erreur de contrôle.

## 2. Pages

Source : `https://xartists.art/build-info.json`

| Champ | Valeur |
| --- | --- |
| release_version | 0.139.0 |
| source_sha | 7b280ccf29765ec7660451559d8a1b453fb79d4a |
| presentation_source_sha | 8a607c8831234fe738a091a5a4caf325811c1b5b |
| lia_live_trading | false |
| public_route_count | 140 |
| built_at | 2026-11-14T18:48:35.921Z |
| renderer | sites-v3 |

Ce build isole les originaux Drive du catalogue NFT. La consultation (musée, exploration, lab 3D local) est le seul go-live honnête.

## 3. API health

Source : `https://xartists-access-api.onrender.com/health` — HTTP 200, cache-control no-store.

| Zone | État |
| --- | --- |
| ok | true |
| source_sha | 8b6fae84e15084883d94e2121a7ab8f6219b7845 (retard vs Pages) |
| jwt / require_siwx | true / true |
| walletless_account_session | false |
| xorus_private_analysis | false |
| moonpay | off |
| stripe live / sandbox checkout | false |
| paybox_configured | true |
| paybox_mode | prod |
| paybox_checkout_enabled | **false** |
| lia_live_trading | "0" |
| mint_live_enabled | false |
| mint_dry_run | true |
| mint_dispatch_enabled | false |
| mint_oidc_pull_enabled | true (bras lecture ≠ mint public) |
| studio_media_upload | off |
| auction / tro_solana_bridge | off |
| orders_backend | postgres |

**Attention :** `paybox_mode=prod` avec checkout désactivé n’est pas un encaissement. `mint_oidc_pull_enabled=true` n’autorise pas un mint public.

## 4. Studio — seul contrôle public fiable

### 4.1 Contrat (tests `studioStoreProbe`)

Réponse publique limitée à cinq champs booléens + backend. Pas de secrets, pas de reason code public.

### 4.2 Production comparée

| Contrat | Live |
| --- | --- |
| GET pas prêt → 503, no-store | **503**, no-store |
| Corps 5 champs | ok, backend, table_ready, schema_ready, model_schema_ready |
| backend=postgres si URL présente | **postgres** |
| POST → 405 | **405** method_not_allowed |
| Upload off | media config enabled=false, modelEnabled=false |

Corps observé :

```json
{"ok":false,"backend":"postgres","table_ready":false,"schema_ready":false,"model_schema_ready":false}
```

**Conclusion :** une `DATABASE_URL` est branchée. Studio n’est pas prêt. Le reason code (`migration_004_missing` vs probe failed vs schéma incomplet) n’est **pas** exposé publiquement — uniquement en log opérateur.

### 4.3 Migrations présentes dans le repo (non appliquées en prod prouvées)

| Fichier | Rôle |
| --- | --- |
| `004_creator_media_pinata.sql` | Table `xartists_studio_media` + index wallet/created_at |
| `005_creator_media_metadata_idempotency.sql` | metadata_sha256 + statut `metadata_pinning` |
| `006_creator_media_glb.sql` | MIME `model/gltf-binary` + plafond 32 Mio |

Les commentaires SQL imposent : base Render confirmée, jamais Neon sandbox non liée, upload reste OFF pendant et après jusqu’à validation.

## 5. Gates métier (inchangés)

| Issue | Objet | État |
| --- | --- | --- |
| #506 | xPortal / Reown QR réel | Preuve manquante |
| #428 | Listing neuf → achat → receipt | Non certifié |
| #548 | xOrus privé / entitlements | OFF |
| Studio 004–006 | Schéma prod | Non certifié |

## 6. Dette technique immédiate

1. **Écart SHA** Pages `7b280cc` vs API `8b6fae84` — redéployer l’API **sans** toucher aux drapeaux.
2. **Studio** — identifier la vraie `DATABASE_URL` Render, backup, 004→005→006, relecture sonde (voir runbook dédié).
3. **PR #594** — tests fail-closed Studio, CI verte, encore draft : fusion tests seule après revue assertions.
4. **xPortal** puis **cycle NFT** — après data plane.

## 7. Interdits

- `CREATOR_MEDIA_UPLOAD_ENABLED=1` avant sonde `ok=true` et schema_ready.
- `mint_live_enabled`, checkout PayBox, `VITE_LIA_LIVE_TRADING=1`.
- Migration sur une base non confirmée comme celle de l’API.
- Confondre CI verte ou docs avec un mint / un paiement live.

Voir aussi : `docs/ops/STUDIO_POSTGRES_UNBLOCK_2026-11-15.md`, `ACTIVE_CONTEXT.md`, `docs/SUITE_LOGIQUE_NOW.md`.

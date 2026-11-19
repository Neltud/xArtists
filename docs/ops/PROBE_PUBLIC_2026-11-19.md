---
hidden: true
noIndex: true
---

# Sonde publique xArtists — 19 novembre 2026 (~12:25 UTC)

Lecture seule. Aucun POST, aucun mint, aucun paiement, aucun changement de drapeau, aucune signature.

## Verdict

Le site est **live**. Le commerce ne l'est pas. Appeler cela un « go-live total » commercial reste une erreur de contrôle.

| Surface | Verdict | Preuve |
| --- | --- | --- |
| Pages | **GO vitrine** | HTTP 200 sur `/`, `/museum/`, `/marketplace/`, `/studio/`, `/intelligence/xorus/` |
| API que le navigateur appelle | **GO service / NO-GO commerce** | Render HTTP 200, tous les rails payants et le mint live off |
| Nom `api.xartists.art` | **NO-GO DNS** | NXDOMAIN. Absent du bundle et du `connect-src` |
| Studio data plane | **NO-GO** | `GET /v1/ops/studio-store/status` → 503, schéma absent |
| xOrus | **GO lecture paper** | signal du 19 nov : `observe`, exécution disabled, fallback |
| Mail `hello@` | **non prouvé** | MX existe, réception réelle toujours #341 |
| Wallet xPortal | **NO-GO preuve** | #506, pas retesté ici |

## Pages

`https://xartists.art/build-info.json`

| Champ | Valeur |
| --- | --- |
| release_version | 0.139.0 |
| source_sha | `fdd072190d0af7e7dbb7386b301b14ac218c9373` |
| presentation_source_sha | `8a607c8831234fe738a091a5a4caf325811c1b5b` |
| built_at | 2026-11-17T13:54:38.043Z |
| lia_live_trading | false |
| public_route_count | 140 |
| workflow | actions/runs/44097312972 |

Le tip `main` du 19 nov est un refresh news `[skip ci]`. Il n'est pas le SHA servi.

Le JS public `/assets/index-sZ8z7Xd4.js` contient `https://xartists-access-api.onrender.com` (1 fois) et **zéro** `api.xartists.art`.

## API Render

`GET https://xartists-access-api.onrender.com/health` → 200.

`GET /v1/ops/build-info` → `source_sha=8b6fae84e15084883d94e2121a7ab8f6219b7845`, `started_at=2026-11-19T12:20:38.275Z`, `execution_authorized=false`.

| Flag | Valeur |
| --- | --- |
| ok / jwt / require_siwx | true / true / true |
| walletless_account_session_enabled | false |
| xorus_private_analysis_enabled | false |
| moonpay | off, non configuré |
| stripe live checkout | false (sandbox test, checkout false) |
| paybox_configured / mode / checkout | true / **prod** / **false** |
| lia_live_trading | `"0"` |
| mint_live_enabled / mint_dry_run / mint_dispatch | false / true / false |
| mint_oidc_pull_enabled | true (lecture, pas un mint public) |
| studio_media_upload | off |
| auction_enabled / auction_settle | false / false |
| tro_solana_bridge | off |
| opensea_order_execution_enabled | false |
| artprice_data_license_verified | false |
| orders-store | 200, postgres, `table_ready=true` |
| studio-store | **503**, postgres, `table_ready=false`, `schema_ready=false`, `model_schema_ready=false` |
| TRO bridge | disabled, mint Solana non vérifié, pas d'adresse de vente |
| CORS `Origin: https://xartists.art` | reflet exact, `Vary: Origin`, pas de credentials |
| CORS origine inconnue | pas de `Access-Control-Allow-Origin` |

`paybox_mode=prod` avec checkout faux n'encaisse rien.

## DNS (DoH Google, 19 nov)

| Nom | Résultat |
| --- | --- |
| `xartists.art` A | 185.199.108–111.153 (GitHub Pages) |
| `www.xartists.art` CNAME | `neltud.github.io.` |
| `api.xartists.art` | **NXDOMAIN** (A et CNAME) |
| MX | `1 mail.xartists.art.` |
| `mail.xartists.art` A | `146.59.146.223` |
| TXT | `v=spf1 a mx a:mail.xartists.art -all` |

MX présent ≠ boîte `hello@` prouvée. #341 reste ouvert.

## xOrus

`GET /v1/signals/daily` : date `2026-11-19`, régime `observe`, confidence `0.4`, `live_trading=0`, `execution=disabled`, source `access-api-fallback`. Ce n'est pas une tape fraîche de marché. Ne pas afficher LIVE.

`/data/lia_status.json` (Pages, horodaté 17 nov 10:25 UTC) : `paper=true`, `LIA_LIVE_TRADING=0`. Le solde on-chain de l'adresse ops est en erreur HTTP 404 côté fichier : ne pas inventer un solde.

## Ce qui a été corrigé dans le même changement

Le workflow `GO public smoke` échouait toutes les 6 h uniquement parce qu'il exigeait `https://api.xartists.art`, un nom sans DNS, alors que le site publié parle à Render. Le probe suit maintenant l'origine du bundle. Si `api.xartists.art` se met à répondre, il doit quand même être l'access-api fail-closed, sinon le smoke casse. Aucun drapeau n'est passé à vrai.

## Suite logique (inchangée dans l'ordre, précisée)

1. **Host nominatif** (#613) — `api.xartists.art` ou équivalent certifié. Render reste le runtime public en attendant. Ne pas y pointer le front avant smoke SHA + CORS.
2. **Mail** (#341) — deux réceptions + une réponse, sans coller de secret.
3. **Deps** — #597, #596, #601 une par une si CI verte. Pas #458 / #459 le même jour qu'un essai wallet.
4. **xOrus drafts** #620 → #619 → #621 — review, flag assisted **absent**.
5. **Wallet** (#506) — allowlist Reown, QR sans coller l'URI `wc:`.
6. **Studio** — backup de la base Render réelle, puis 004→006, upload encore off.
7. **#428** listing/achat — seulement après 1–5, avec deux wallets et un Explorer.

Interdit : `XORUS_ASSISTED_SWAP_ENABLED`, `XORUS_LIVE_TRADING`, checkout PayBox, `mint_live_enabled`, `CREATOR_MEDIA_UPLOAD_ENABLED=1`, merger #407 / #430.

## Veille — 19 novembre 2026

Sources DefiLlama, pages datées du 19 nov (liquid staking Hatom : snapshot du 17). On cite. On n'exécute pas. xOrus s'abstient (`observe` / fallback).

| Repère | Valeur | Lecture |
| --- | --- | --- |
| TVL MultiversX | **10,44 M$** | −2,44 % / 24 h. Le 16 nov la suite interne citait 10,73 M$. Baisse, pas un signal d'entrée |
| Volume DEX 24 h (page chaîne) | **241 k$** | Page DEX dédiée le même jour : **170 k$**, quasi tout xExchange. Ne pas additionner les deux |
| Volume DEX 7 j | **1,25 M$** | +37 % sur 7 j, sur une base mince |
| EGLD | **2,55 $** | capitalisation **79,56 M$** (16 nov : ~2,62 $ / 81,6 M$) |
| Hatom protocole | **8,62 M$** | −3,4 % / 24 h, −10 % / 7 j, −21 % / 30 j |
| Hatom liquid staking | **~2,2 M$** | module distinct. Ne pas l'ajouter au 8,62 M$ |
| xExchange (page chaîne) | **3,22 M$** | −1,3 % / 24 h. La fiche protocole mélange un TVL plus large (staking inclus) : ne pas le substituer |
| Yield EGLD > 100 k$ TVL | **~2 %** | un pool hatom-lending ~158 k$, relevé du 18 nov. Pas un orchestrateur à brancher |
| Frais chaîne 24 h | **44 $** | marché trop fin pour un rééquilibreur Hatom / xExchange |

Un orchestrateur de rendement sur cette liquidité optimiserait du slippage. On ne le branche pas. Reown AppKit ne remplace pas la preuve #506. Les passkeys P-256 ne signent pas un compte MultiversX.

## Issues ouvertes qui bloquent encore un GO commercial

#613 host · #341 mail · #506 wallet · #428 escrow · #465 comptes · #548 xOrus privé · #403 mint Genesis · #281 livraison mint · #487 licence Artprice · #416 xRights · #570 Jupiter (chemin LIA retiré, signature déjà refusée).

18 PR ouvertes au 19 nov, dont #591 release 0.140.0 en attente et #618–#622 en draft xOrus. Aucune n'est une autorisation de fusion prise ici.

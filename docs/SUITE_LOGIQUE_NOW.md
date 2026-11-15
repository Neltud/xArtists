---
hidden: true
noIndex: true
---

# Suite logique — 15 novembre 2026

Probe **2026-11-15T05:35Z**. Ce document est l'ordre d'exécution. Il ne lève aucun gate commercial. Appeler « go-live total » un site dont le trading, le mint et le fiat sont éteints reste interdit.

## Vérité déployée

| Surface | État observé |
| --- | --- |
| **Pages** [build-info.json](https://xartists.art/build-info.json) | `0.139.0` · `7b280ccf29765ec7660451559d8a1b453fb79d4a` · `lia_live_trading=false` · 140 routes · `built_at=2026-11-14T18:48:35.921Z` |
| **API** [health](https://xartists-access-api.onrender.com/health) | HTTP 200 · `ok=true` · SHA `8b6fae84e15084883d94e2121a7ab8f6219b7845` (**14 nov 05:04 UTC**, en retard) · `lia_live_trading=0` · `mint_live_enabled=false` · `mint_dry_run=true` · `mint_oidc_pull_enabled=true` · `studio_media_upload=off` · Stripe / MoonPay off · PayBox `mode=prod` et `checkout=false` · sessions sans wallet off · xOrus privé off · enchères off · pont $TRO off |
| **Studio DB** | [studio-store/status](https://xartists-access-api.onrender.com/v1/ops/studio-store/status) → **HTTP 503**, tables et schéma absents |
| **Trading autonome** | **NO-GO** |
| **Commerce fiat** | **NO-GO** |
| **Mint live** | **NO-GO** |

Le pull OIDC de mint est armé. Ce n'est pas un mint live : dry-run vrai, dispatch faux, live faux.

## GO vs NO-GO

| Module | Verdict | Condition de levée |
| --- | --- | --- |
| Site public / musée / exploration | **GO** | Déjà live en 0.139.0 |
| xOrus paper | **GO lecture** | Rester paper. Ne pas afficher LIVE |
| Marketplace découverte | **GO lecture** | Listing / achat **NO-GO** tant que #428 n'a pas un cycle neuf |
| Studio upload IPFS / GLB | **NO-GO** | DB liée, 004–006, backup, Pinata, CID relu |
| xPortal | **NO-GO preuve** | Allowlist Reown + QR navigateur réel (#506) |
| PayBox / Stripe / MoonPay | **NO-GO** | Webhook, révocation, cadre légal. Le mode `prod` de PayBox ne suffit pas |
| LIA / xOrus trading | **NO-GO** | Gel ops. Incident 30 oct = référence |
| Mail hello@ | **NO-GO** | Réception non certifiée |
| API = Pages | **ÉCART** | Redéployer Render sur `7b280cc` sans toucher aux drapeaux |

## Ordre

1. **Wallet** — session Reown / xPortal réelle. Pas d'adresse forgée.
2. **Studio** — `DATABASE_URL` runtime, backup / restore, migrations, un upload, un CID, une relecture. Ensuite seulement le drapeau d'upload.
3. **Marché** — un listing **nouveau**, signé par l'artiste, acheté par un autre wallet, reçu Explorer, possession acheteur (#428).
4. **Comptes** — JWT email, SIWX, entitlement serveur (#548).
5. **Un rail** — preprod, webhook, révocation, un seul drapeau.
6. **API puis OVH** — aligner le SHA Render. L'image OVH reste parallèle tant que la reprise n'est pas jouée.

## Interdits

* Traiter la 0.139.0 comme une ouverture commerciale.
* Signer ou recharger le hot wallet LIA Ops.
* `VITE_LIA_LIVE_TRADING=1`, checkout PayBox, `claimFees`, Jupiter live non audité.
* Migrer Studio à l'aveugle.
* Confondre `mint_oidc_pull_enabled=true` avec un mint public.
* Confondre `paybox_mode=prod` avec un encaissement.

## Veille (15 nov 2026, matin)

* DefiLlama, chaîne MultiversX, datée du 15 nov : TVL **10,51 M$** (−7,8 % / 24 h), DEX 24 h **~390 k$**, EGLD affiché **2,59 $** / capitalisation **80,65 M$**. La fiche token du même matin imprimait **2,51 $** et **78,38 M$**. On cite l'écart. On n'en fait pas un ordre.
* Hatom ~**8,65 M$** (−10 % / 24 h, −22 % / 30 j). xExchange ~**3,23 M$**.
* Upbit, notice `207379109` du 23 oct : vigilance EGLD jusqu'au **16–20 nov 2026**. Pas de levée relue ce matin.
* Reown AppKit (1.8.x, SIWX, social, QR) ne remplace pas la preuve #506. Les passkeys P-256 ne signent pas un compte MultiversX.

## Références

* [ACTIVE_CONTEXT.md](../ACTIVE_CONTEXT.md)
* [docs/ANALYSE_DAPP_COMPLETE.md](ANALYSE_DAPP_COMPLETE.md)
* [docs/security/launch-gates.md](security/launch-gates.md)
* [#506](https://github.com/Neltud/xArtists/issues/506) · [#428](https://github.com/Neltud/xArtists/issues/428) · [#548](https://github.com/Neltud/xArtists/issues/548)

## Reprise de passation — 15 novembre, après PR #594

- **Code vérifié dans GitHub** : [PR #594](https://github.com/Neltud/xArtists/pull/594) fusionnée au SHA `7d313eac760fab8770f10f5982ad9f53f9aa2fe6`. Le contrôle Studio exige désormais que l'index quota vise la table attendue ; cinq tests de régression ajoutés, CI PR 7/7 success avant fusion.
- **Observation de déploiement transmise par l'opérateur** : Pages 0.139.0 / SHA `7d313eac` à 10:56 UTC, **non revalidée ici**. Ne pas confondre un SHA Pages avec le SHA API.
- **Tentative de sonde de cette session** : les quatre endpoints build-info, health, studio-store/status et xorus/analysis n'ont pas pu être atteints depuis l'environnement d'exécution (DNS indisponible / accès web refusé). **Aucun nouveau verdict live** ne peut être déduit.
- **P0 strict** : #506 preuve navigateur Reown QR + xPortal ; Studio : identité DB externe attestée et backup/restore avant migrations 004/005 et 006 optionnelle. #428 listing signé + achat autre wallet + receipt et possession seulement après #506.
- **Cible hébergement** : serveur OVH pour l'API, en parallèle sans bascule DNS. `deploy/ovh/README.md` décrit un package, pas un serveur déjà déployé. Ne pas copier un `DATABASE_URL` non identifié.
- **Commerce** : tous les flags financiers, mint et trading restent NO-GO ; aucune activation implicite par ce document.

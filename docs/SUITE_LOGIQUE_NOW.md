---
hidden: true
noIndex: true
---

# Suite logique — 16 novembre 2026

Probe **2026-11-16T05:33Z**. Ce document est l'ordre d'exécution. Il ne lève aucun gate commercial. Appeler « go-live total » un site dont le trading, le mint et le fiat sont éteints reste interdit.

## Vérité déployée

| Surface | État observé |
| --- | --- |
| **Pages** [build-info.json](https://xartists.art/build-info.json) | `0.139.0` · `5bf83162852840b6331f42ce1f59db4224e79a2c` · `lia_live_trading=false` · 140 routes · `built_at=2026-11-15T15:21:23.194Z` |
| **API** [health](https://xartists-access-api.onrender.com/health) | HTTP 200 · `ok=true` · SHA `8b6fae84e15084883d94e2121a7ab8f6219b7845` (**14 nov 05:04 UTC**, en retard) · `lia_live_trading=0` · `mint_live_enabled=false` · `mint_dry_run=true` · `mint_dispatch_enabled=false` · `mint_oidc_pull_enabled=true` · `studio_media_upload=off` · Stripe / MoonPay off · PayBox `mode=prod` et `checkout=false` · sessions sans wallet off · xOrus privé off · enchères off · pont $TRO off |
| **Studio DB** | [studio-store/status](https://xartists-access-api.onrender.com/v1/ops/studio-store/status) → **HTTP 503**, `backend=postgres`, tables et schéma absents. Pas de code raison dans le JSON |
| **xOrus** | `paper_only` · **ABSTAIN** `thin_tape` · 16 nov 05:33 UTC · aucune exécution |
| **Trading autonome** | **NO-GO** |
| **Commerce fiat** | **NO-GO** |
| **Mint live** | **NO-GO** |

Le pull OIDC de mint est armé. Ce n'est pas un mint live : dry-run vrai, dispatch faux, live faux.

Le tip `main` peut être un commit news `[skip ci]`. Le SHA qui compte pour le public est celui de `build-info.json`, pas le tip git.

## GO vs NO-GO

| Module | Verdict | Condition de levée |
| --- | --- | --- |
| Site public / musée / exploration | **GO** | Déjà live en 0.139.0 / `5bf83162` |
| xOrus paper | **GO lecture** | Rester paper. Ne pas afficher LIVE. Abstention en cours |
| Marketplace découverte | **GO lecture** | Listing / achat **NO-GO** tant que #428 n'a pas un cycle neuf |
| Studio upload IPFS / GLB | **NO-GO** | DB liée, backup, 004–006, Pinata, CID relu |
| xPortal | **NO-GO preuve** | Allowlist Reown + QR navigateur réel (#506) |
| PayBox / Stripe / MoonPay | **NO-GO** | Webhook, révocation, cadre légal. Le mode `prod` de PayBox ne suffit pas |
| LIA / xOrus trading | **NO-GO** | Gel ops. Incident 30 oct = référence |
| Mail hello@ | **NO-GO** | Réception non certifiée |
| API = Pages | **ÉCART** | Redéployer Render sur le `main` courant sans toucher aux drapeaux |

## Ordre

1. **Wallet** — session Reown / xPortal réelle. Pas d'adresse forgée. Dashboard, pas un commit.
2. **Studio** — `DATABASE_URL` runtime, backup / restore, migrations, un upload, un CID, une relecture. Ensuite seulement le drapeau d'upload.
3. **API** — redéploiement Render du code déjà sur `main`, variables inchangées. Le push git ne redéploie pas Render tout seul.
4. **Marché** — un listing **nouveau**, signé par l'artiste, acheté par un autre wallet, reçu Explorer, possession acheteur (#428).
5. **Comptes** — JWT email, SIWX, entitlement serveur (#548).
6. **Un rail** — preprod, webhook, révocation, un seul drapeau. OVH reste un package parallèle.

## Interdits

* Traiter la 0.139.0 comme une ouverture commerciale.
* Signer ou recharger le hot wallet LIA Ops.
* `VITE_LIA_LIVE_TRADING=1`, checkout PayBox, `claimFees`, Jupiter live non audité.
* Migrer Studio à l'aveugle ou sur une sandbox Neon orpheline.
* Confondre `mint_oidc_pull_enabled=true` avec un mint public.
* Confondre `paybox_mode=prod` avec un encaissement.
* Écrire `migration_004_missing` comme un fait frais : le JSON public ne le dit plus.

## Veille (16 nov 2026, 05:33 UTC)

* DefiLlama, chaîne MultiversX, page datée du 16 nov : TVL **10,73 M$** (+1,82 % / 24 h), volume DEX 24 h **~165 k$**, EGLD **2,62 $**, capitalisation **81,59 M$**. Le 15 nov au matin la même famille de chiffres était ~10,51 M$ et ~2,5–2,6 $. On cite l'écart. On n'en fait pas un ordre. xOrus, au même instant, **s'abstient** (`thin_tape`).
* Hatom (protocole, page chaîne) ~**8,9 M$** (+3,2 % / 24 h, −10 % / 7 j, −21 % / 30 j). xExchange ~**3,28 M$**. Le module liquid staking Hatom est un autre chiffre (~2,2 M$ au 15 nov) : ne pas les additionner deux fois.
* Upbit, notice `207379109` : vigilance EGLD **jusqu'au 16–20 nov 2026**. Nous sommes **dans** la fenêtre. Pas de levée relue. Pas de phrase publique sur la sûreté des dépôts.
* Reown AppKit ne remplace pas la preuve #506. Les passkeys P-256 ne signent pas un compte MultiversX.
* Un orchestrateur de rendement Hatom / xExchange, aujourd'hui, optimiserait du slippage sur un marché mince. On ne le branche pas.

## Références

* [ACTIVE_CONTEXT.md](../ACTIVE_CONTEXT.md)
* [docs/ANALYSE_DAPP_COMPLETE.md](ANALYSE_DAPP_COMPLETE.md)
* [docs/security/launch-gates.md](security/launch-gates.md)
* [#506](https://github.com/Neltud/xArtists/issues/506) · [#428](https://github.com/Neltud/xArtists/issues/428) · [#548](https://github.com/Neltud/xArtists/issues/548)

## Archive de sonde — 15 novembre

Les SHA `7b280cc` (Pages, soir du 14) puis l'observation opérateur `7d313eac` (matin du 15) sont dépassés par le build `5bf83162` de 15:21 UTC. PR #594 (index quota Studio) reste fusionnée dans git ; elle n'a pas rendu le store prêt, et l'API qui répond encore est plus ancienne que cette PR.

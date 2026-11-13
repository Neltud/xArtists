# ACTIVE_CONTEXT — xArtists / xOrus

## Mise à jour opératoire — 13 novembre 2026 (09:09 UTC)

**Ce bloc remplace les chiffres et les statuts des instantanés plus anciens ci-dessous.** Toute décision doit relire les endpoints frais, car les déploiements sont asynchrones et une réponse HTTP 503 peut être transitoire. Aucune CI ou transaction pilote n'autorise automatiquement le commerce.

- **Site publié** : [xartists.art/build-info.json](https://xartists.art/build-info.json) a rendu `source_sha=72c391b36bbdb60e2b8f232bfdb596b082a387aa`, `release_version=0.137.0`, `public_route_count=133`, `lia_live_trading=false` et `built_at=2026-11-13T08:30:49.314Z`. La refonte Lab [#547](https://github.com/Neltud/xArtists/pull/547) est donc publiée : l'analyse xOrus apparaît avant la simulation fictive. La version reste celle du manifeste, non une preuve de paiement.
- **Analyse xOrus** : [GET /v1/xorus/analysis](https://xartists-access-api.onrender.com/v1/xorus/analysis) a rendu un rapport serveur `xorus_analysis/v2` valide le 13/11 à **09:09:32 UTC**, pour des observations clôturées à **08:59:59 UTC** : **48 bougies horaires** (première source publique Binance Spot EGLD/USDT), **6 indicateurs** dérivés sur **3 familles**, **0 preuve indépendante**, verdict **ABSTAIN**, `mode=paper_only`, `commercial_enabled=false`, `access_granted=false`. Les données brutes et les valeurs fournisseur ne sont pas exportées dans la projection client. Des sondes HTTP 503 ont aussi été observées pendant le sprint ; ces réponses ne prouvent pas une panne permanente.
- **Cache xOrus** : [#549](https://github.com/Neltud/xArtists/pull/549), fusionnée dans `main` au SHA `01c1cc0d3e6147d8763c5c7c16bfba98ccb192c9` après **10 workflows verts**, réévalue la fraîcheur de chaque réponse en cache, y compris pendant un `Retry-After` fournisseur de 30–60 minutes. Le test backend xOrus a maintenant un job CI déclenché par ses propres fichiers. Ne pas supposer que cette correction est déployée sur l'API avant la vérification de la nouvelle image.
- **Marketplace réel** : workflow de lecture seule de [#550](https://github.com/Neltud/xArtists/pull/550) à **09:05:43 UTC** : achat **historique** du listing **#2**, NFT `ASFT-a6273a-01`, transaction [`e87a5109…`](https://explorer.multiversx.com/transactions/e87a51092a673e5207c254a200ddc2f407b0c5130c6759bdae158d6870ac7268) avec statut `success`, montant exact **0,25 EGLD**, NFT observé dans le wallet acheteur. Inspection fraîche du SC : codeHash conforme au registre, `isPayable=true`, `paused=false`, `feeBps=300`, **0 listing actif parmi 2 inspectés**. Cette preuve pilote n'ouvre pas Buy/Bid/Offer au public ni ne certifie un nouveau listing. La PR [#550](https://github.com/Neltud/xArtists/pull/550) est depuis **fusionnée** sur `main` (SHA `aa47d82031c71561ed770d804ed4258f1c916b0a`, **9 workflows verts**) : recherche des NFT chargés, deep links, préparation sans contourner la signature, prix non prérempli. Sa présence effective sur le site doit être certifiée via `build-info.json`.
- **Commandes / mint jobs** : [status orders](https://xartists-access-api.onrender.com/v1/ops/orders-store/status) et [status mint](https://xartists-access-api.onrender.com/v1/ops/mint-jobs-store/status) ont rendu `ok=true, backend=postgres, table_ready=true`. Cela certifie la présence des tables et non la livraison d'un NFT ni des paiements.
- **Studio / IPFS** : [studio-store/status](https://xartists-access-api.onrender.com/v1/ops/studio-store/status) reste **HTTP 503**, l'upload demeure `off`, aucune base Studio réelle ni migration 004/005/006, ni CID/Pinata ni reconstruction GLB n'est certifiée. **Ne pas migrer** la sandbox Neon par déduction ; il faut une preuve du `DATABASE_URL` lié au runtime et backup/restauration.
- **Comptes, prix, paiements** : le point [health](https://xartists-access-api.onrender.com/health) annonce `stripe_configured=false`, `stripe_live_checkout_enabled=false`, `paybox_checkout_enabled=false`, `mint_live_enabled=false`, `mint_dry_run=true`, `studio_media_upload=off`, `artprice_data_license_verified=false`. Les trois mensualités EUR sont des **objectifs commerciaux**, distincts des packs NFT Genesis, sans entitlement ni checkout certifié. Issue [#548](https://github.com/Neltud/xArtists/issues/548) fixe le dossier SaaS : JWT email vérifié, liaison wallet, preuve PSP, droits serveur, quotas, annulation et révocation. xPortal nécessite toujours la preuve Reown/origines du vrai navigateur [#506](https://github.com/Neltud/xArtists/issues/506).
- **Infrastructure** : Render sert encore l'API publique ; le conteneur OVH parallèle a passé sa CI mais **aucune bascule DNS/base de données n'est constatée**. Ne pas transférer secrets, portefeuilles ou paiements à un nouveau serveur sans recette de reprise.

**Prochain ordre de travail** : 1) certifier l'origine Reown/xPortal et un wallet utilisateur signataire ; 2) prouver la cible PostgreSQL Studio, migrer **après** restauration testée, contrôler Pinata et un CID retour ; 3) démontrer un **nouveau** listing signé par un artiste, puis achat distinct et reçu final ; 4) livrer le compte email et les droits d'analyse xOrus *privés* (pas dans le frontend public) ; 5) activer un seul rail de paiement après tests webhook/révocation et conditions légales. Les autres modules restent en découverte jusqu'à preuves spécifiques.

---


**Relevé technique :** 12 novembre 2026, 17:02 UTC (snapshot, jamais un feu vert commercial).  
**Branche :** `main` · **release publique :** `0.136.0`.  
**Dernier SHA de référence observé :** `7a0290664cbf5a5efe991271037fc7ee832e9602`, vérifié sur **GitHub Pages** et l'API Render.  
**Vérité déployée :** [build-info.json](https://xartists.art/build-info.json) — relire le SHA exact **au moment de toute action**, car ce document lui-même crée un nouveau commit.  
**API publique :** [health](https://xartists-access-api.onrender.com/health) · [Studio DB readiness](https://xartists-access-api.onrender.com/v1/ops/studio-store/status).

## Situation réelle et parcours simples

| Parcours / module | État vérifié ou limite |
| --- | --- |
| Accueil, musée, exploration NFT, xOrus | Dapp publique, 133 routes référencées. Consultation possible sans wallet ; xOrus **paper**, aucun trading automatique |
| Marketplace | Grille réelle de découverte ; vente d'un NFT détenu préparée, mais **parcours listing signé → achat → règlement → réception non certifié**. Pas de Buy/Bid/Offer public déclaré opérationnel |
| Studio et sculpture 3D | Préparation de collections, rendu GLB, protections de session. Le schéma PostgreSQL GLB est livré en code (#531), **pas migré/certifié en production** ; son diagnostic HTTP 503 interdit tout GO upload |
| Comptes utilisateurs | Distinguer exploration sans wallet, compte email authentifié et wallet signataire. **Pas de comptes walletless de production prouvés**. Neon `xartists-access-sandbox` avec vérification email OTP n'est pas la preuve de la base API live |
| Fiat et cryptomonnaies | Stripe et MoonPay non configurés en production ; PayBox checkout désactivé. Aucun achat, subscription ou conversion fiat→NFT auto revendiqué |
| Distributeur NFT, xRights, Artprice | Distributeur paper sans livraison prouvée ; droits/licences et entitlements premium à certifier ; données Artprice B2B sans licence vérifiée |
| Infrastructure | GitHub Pages public + API Render opérationnelle. Image autonome Node/Caddy OVH (#534) validée en CI, **aucun serveur OVH basculé ni base migrée**. Akash reste une option de calcul sans données clients |

## Lots livrés et preuves du 12 novembre

- [#528](https://github.com/Neltud/xArtists/pull/528) : release `0.136.0`, manifest et changelog mis à jour.
- [#531](https://github.com/Neltud/xArtists/pull/531) : migration `006_creator_media_glb.sql` et endpoint de diagnostic PostgreSQL portable ; tests PostgreSQL éphémères réussis, **production non migrée**.
- [#532](https://github.com/Neltud/xArtists/pull/532) : suppression du faux identifiant invité fiat→mint, accès lecture seule sans wallet, lien public xOrus. **9 workflows verts**, déploiement public du commit de fusion vérifié.
- [#534](https://github.com/Neltud/xArtists/pull/534) : image Access API autonome Node 22 + Docker Compose/Caddy HTTPS OVH, fichiers sans secrets, vérifications et rollback. **8 workflows verts**, code publié sur `main` et API Render, **pas d'installation OVH**.

## Priorités ordonnées, avec conditions d'arrêt

1. **Données Studio :** identifier la base réellement reliée à l'API, tester backup/restauration, puis contrôler 004/005/006. Aucune migration ou activation IPFS aveugle ; vérifier un vrai CID et la lecture retour.
2. **xPortal :** confirmer l'allowlist Reown pour `xartists.art` et `www.xartists.art`, puis générer un QR depuis un vrai navigateur. Un test SDK CI ne prouve ni QR ni connexion. [#506](https://github.com/Neltud/xArtists/issues/506).
3. **Transactions :** vérifier le smart contract déployé, ABI/codeHash, propriété du NFT, frais et destinataire ; démontrer un listing signé et une livraison on-chain réelle, sans prétendre qu'un bouton frontend suffit. [#428](https://github.com/Neltud/xArtists/issues/428).
4. **Comptes / fiat :** brancher l'auth email réellement vérifiée, liaison SIWX, commandes cloisonnées et abonnements récurrents seulement après preuve webhooks/révocations et accès serveur. Pas de faux droit NFT pour un achat fiat invité.
5. **OVH :** utiliser [deploy/ovh/README.md](deploy/ovh/README.md) pour déploiement **parallèle** sur hôte confirmé avec DNS/HTTPS ; tester les parcours et la reprise avant modification de l'URL API publique. Conserver Render pour retour arrière.

**Sécurité :** aucun changement de flag financier, signature/mint, trade, clé privée, DNS, paiement ou migration de production n'est autorisé par une CI ou par ce document.

---

## Archive historique — snapshot du 11 novembre 2026

Les lignes suivantes sont conservées pour traçabilité : anciens SHA/versions/prix et anciens statuts de PR **ne décrivent pas le déploiement actuel**. Le tableau ci-dessus et les sondes publiques priment.

## Décision de publication — Marketplace #495

- [PR #495](https://github.com/Neltud/xArtists/pull/495) : **fusionnée**, 14/14 contrôles GitHub de la PR verts, dont Chrome responsive, sécurité, TypeScript, release et navigation mobile. Le commit déployé est exactement le SHA ci-dessus.
- `/marketplace` redirige vers `/explore/market` ; l'onglet Art ouvre directement sur **une grille de cartes d'œuvres**, sans bannière marketing avant les images. Catégories, recherche et filtres restent accessibles en première zone.
- Grille : **2 colonnes mobile**, **3 tablette**, **4 desktop**, avec 4 œuvres exposées du studio provenant d'actifs réellement publics `/art/drive/` et NFT lus en **lecture seule** depuis l'API MultiversX (wallet LIA et dépôts du contrat).
- Instantané de lecture du catalogue public au 11 novembre : **13 cartes** (4 œuvres d'exposition, 1 dépôt, 8 NFT détenus). Comptage instantané, **pas 13 ventes**, ni une garantie de disponibilité.
- Étiquettes : `exposition / hors vente`, `détenu / non listé`, `dépôt / vente non prouvée`, `index externe / non vérifié`. Le montant d'un index n'est jamais une offre on-chain exécutable. Pas de bouton « Acheter » inventé.
- Les outils LIA/inventaires avancés restent disponibles dans un panneau technique replié, monté seulement à l'ouverture. Huit langues, RTL arabe, contrôles Playwright 360/390/430/768/1440 px.
- Validation UX complémentaire du navigateur public indépendante des tests de PR ; toute anomalie future sera tracée séparément.

## Garde-fous maintenus — NO-GO commercial / trading

- `build-info.json.lia_live_trading=false` confirmé. `VITE_LIA_LIVE_TRADING` reste à **0** ; aucun trading autonome LIA autorisé.
- PayBox **fail-closed** ; pas de PayBox production, débit Stripe, achat, vente, signature, broadcast ou mint automatiques permis par le correctif UX.
- Aucune liquidation, swap ou recharge du wallet LIA Ops. Le burst de signatures du 30 octobre 2026 reste un incident de sécurité de référence.
- Fenêtre de surveillance Upbit/Bithumb EGLD **16–20 novembre 2026**, selon l'audit de risque daté du 11 novembre ; seule une levée officielle vérifiée et un protocole opérateur distinct pourraient réexaminer le gel.
- Tout prix d'Agents SC, état de listing (`getListing`) et possession NFT exige une **lecture on-chain fraîche** avant une transaction. Les prix de packs consignés dans d'anciennes notes peuvent diverger : **ne pas s'en servir comme tarif live**.
- Treasury destination `null` : pas de `claimFees`, pas d'activation silencieuse de DAO/proposals.

## Travail encore bloqué, à garder séparé

- **#480** authentification walletless Neon JWT Ed25519 (**draft**) et **#481** Stripe Billing EUR sandbox (**draft**) : ne pas fusionner ni activer avant preuves JWT, S1/S2 paiement-livraison, remboursement et My Packs NFT.
- **#478** dossier de GO commercial par rail (**draft**) et **#482** OVH/DNS/mail readiness (**draft**) : ne pas confondre dossiers de préparation et permissions de production.
- **#494** assainissement de l'historique / soumissions venue (**draft**) : conserver en revue de sécurité, sans merge automatique.
- **#466** release-please `0.132.0` : ne pas fusionner pour un simple changement de numéro.
- Artprice officiel : liens de référence uniquement tant qu'une licence B2B de données n'est pas prouvée.
- Messagerie `hello@xartists.art` : DNS configurés, **réception SMTP réelle non certifiée**.
- Prochaines priorités : vérification visuelle publique de la grille et des images, étiquettes de provenance/fraîcheur, simplification des sous-modules, audit mobile final ; paiements et mint restent sous gates distincts.

---

> **Archive historique ci-dessous (snapshot du 1er novembre 2026).** Les anciens prix, balances, cours, statuts et URLs GitHub Pages sont conservés pour traçabilité, **pas** comme vérité courante. Pour l'état de production, utiliser la section du 11 novembre ci-dessus et le SHA de `build-info.json`.


## 1. On-chain status (probe 2026-11-01T05:48:00Z)

| Item | Value |
|------|--------|
| Epoch | **2280** · refreshRate **600** · rounds passed **78106** / 144000 |
| EGLD | **$3.44** · mcap **$106.92M** · circ 31.08M · staked 13.90M · APR **9.12%** |
| Supernova | LIVE depuis le 10 sept 2026 (epoch 2233) · **+47 epochs** |
| Agents SC | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| codeHash | `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` (inchangé) |
| Agents balance | **0.013 EGLD** · non payable par SC |
| Pack prices | Pulse **10** / Yield **5** / Sentinel **2.5** EGLD |
| Market | `…8txmm` · **0.0175 EGLD** · hash inchangé · payable |
| Listing #1 / #2 | acheter **#2** seulement · le 0,25 EGLD est une preuve historique, pas un prix d’affichage |
| Slot | **0.5000 EGLD** · hash inchangé · `isPayable=false` · REAL fermé |
| LIA Ops | **0.907888 EGLD** · nonce **1487** |
| $TRO | `TRO-94c925` · circ **476,224** · **561** comptes · ~$0.00008223 · mcap ~$39.16 · **2815** tx |
| Treasury | dest **null** — ne pas `claimFees`. Balance 0. |

### Rupture du gel LIA Ops — 30 oct 17:20–17:29 UTC

Le probe du 30 oct 05:36 UTC disait nonce **1479** figé et solde **1.585598 EGLD**. Ce n’est plus vrai. Le même jour, le wallet `erd1p4zyy…qu0crn6` a signé **8 transactions** :

| Nonce | Heure UTC | Appel | Hash |
|------:|-----------|-------|------|
| 1479 | 17:20:15 | `xo` | `c13a93e6d12bdc76786008fa3854732fa17a3a31d1ee9c652f9fccc80a67abd2` |
| 1480 | 17:21:49 | `xo` (HTM) | `2203554da8705960c3f0cb857ee12f527cc469c589f8cab2f427dc870d475d77` |
| 1481 | 17:22:34 | `xo` (MEX) | `4a75d24dfa748364a24e60a62f63b711a658411189c5ddea591da3dde34765b2` |
| 1482 | 17:24:12 | `xo` (XOXNO) | `b43a431a274b24859a79549c29dc6d75610b9a8ab3880c967af95b5362274303` |
| 1483 | 17:25:18 | `xo` | `52a2539ca07cda7d7e2c474834fa2d977f4f2aba2fe311ba56f906d8e0436103` |
| 1484 | 17:27:02 | `removeLiquidity` TROMEX | `2f4db7e4d65e3730aa69c2e454f6cb69274736f07b1cae4bf647877b1e8b4d64` |
| 1485 | 17:27:27 | `composeTasks` | `3d4e3ffddc105bd059df49384078f30cbfd5d19e4b136c77ac49ae8e6325d109` |
| 1486 | 17:29:24 | `transfer` **7.09 EGLD** → owner $TRO `erd1mmh2j…ucj5l` | `8ad06a590619824325bf382bb48fb2e8de13368f8ad8bb39f5f3bda9e52c0a0a` |

Conséquence : **−0.68 EGLD** environ sur le hot wallet, plus la sortie de liquidité TROMEX. Ce n’est **pas** le client Pages. Ce n’est **pas** une autorisation de continuer. Ne pas recharger LIA Ops. Ne pas enchaîner un nouveau swap.

---

## 2. Revues coréennes (bloquant trading) — TOUJOURS EN FORCE

**Upbit** notice **207379109**, 23 oct 06:02 UTC : warning EGLD/KRW, EGLD/BTC, EGLD/USDT jusqu’au **16–20 nov 2026**. Aucun post `@Official_Upbit` de levée indexé au **1er nov 2026**.  
**Wallet Upbit** : dernier constat public **30 oct** — retraits seuls, dépôts bloqués, désignation **유의** toujours là. Non ré-observé le 1er nov. Reprise des retraits ≠ levée.  
**Bithumb** : warning EGLD + FET prolongé le 23 oct. Prochaine annonce EGLD **16–20 nov**. Fenêtre **FET 2–6 nov** (demain) **n’est pas** une levée EGLD.  
Notice INIT = autre actif.  
**Ne pas relancer de trade LIA Ops.** Phase code : `extended`. Au probe : **jour 9/29**, **15 j** avant le 16 nov, **20 j** avant le 21 nov 00:00 UTC.

EGLD **$3.44** n’est pas un signal d’exécution.

---

## 3. Security

| Finding | Status |
|---------|--------|
| Tickers mainnet XAIPLS / XAIYLD / XAISNT | résolu |
| Paper mint prod | DEV only |
| Paybox | UI **fail-closed** (`VITE_PAYBOX_ENABLED` défaut `false`). Rail Render = **preprod**. Ne pas passer `PAYBOX_ENV=prod`. |
| User-sign | `static.yml` : `VITE_LIA_LIVE_TRADING` défaut **0**. Une variable dépôt `=1` n’arme qu’xPortal + caps, pas un PEM, pas LIA Ops. |
| Gel clé LIA Ops | **rompu le 30 oct 17:29 UTC** au niveau du signataire. Le code Pages ne peut pas le refermer. Ne pas signer d’autres TX ops. |
| Prix fiat | catalogue serveur 110 / 75 / 50 €, wallet erd1 requis |
| Prix listing UI | pas de fallback inventé `0.25` |
| Snapshot entité | API live, repli = probe du **1er nov** |
| PR #200 `feat/orders-neon-store` | **non mergée**. Lockfile `access-api` cassé. |
| PR #221 release-please 0.126.0 | ouverte, **pas** ce probe. Ne pas la merger pour « faire le go-live ». |
| Bouton « Sign & broadcast » des proposals | **verrouillé**. |

---

## 4. Ce push

- `/go-live` reste explicite : **site = go-live**, **trading autonome = non**.
- Le repli ne sert plus le chrome du 30 oct (epoch 2278, EGLD $3.21, nonce 1479).
- Stamp **0.126.0**. `BUILD_ID.txt` était resté sur `0.124.0` : corrigé.
- `static.yml` : l’étape Pages revient à la racine du dépôt avant de copier `dist/` vers `_site/`. Sans ce `cd`, l’artifact pointait au mauvais chemin.
- Paybox défaut **false**. LIA défaut workflow **0**.

Voir [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md) et [`docs/SUITE_LOGIQUE_NOW.md`](docs/SUITE_LOGIQUE_NOW.md).

---

## 5. Multi-IA roles

| Agent | Role | Scope |
|-------|------|--------|
| **Grok** | Dev / Ops | Code, workflows, probes, build Pages |
| **Gemini Flash** | Lead Architect / Audit | Revue architecture, cohérence |
| **LIA (Vellum)** | Trading & Curation | **suspendu** jusqu’à une notice de maintien. Le burst du 30 oct ne rouvre pas le mandat. |

## 6. Liens

- dApp: https://neltud.github.io/xArtists/
- GO_LIVE: https://neltud.github.io/xArtists/#/go-live
- Upbit notice: https://www.upbit.com/service_center/notice?id=207379109
- Transfert 7,09 EGLD: https://explorer.multiversx.com/transactions/8ad06a590619824325bf382bb48fb2e8de13368f8ad8bb39f5f3bda9e52c0a0a
- Repo: https://github.com/Neltud/xArtists
- Explorer agents: https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg

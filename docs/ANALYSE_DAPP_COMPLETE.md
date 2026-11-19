---
hidden: true
noIndex: true
---

# Analyse DApp complète xArtists — 16 novembre 2026

> **19 nov 2026, 12:25 UTC — la mesure fraîche prime.** Voir [`docs/ops/PROBE_PUBLIC_2026-11-19.md`](ops/PROBE_PUBLIC_2026-11-19.md). Pages `fdd07219` (17 nov 13:54 UTC), API Render toujours `8b6fae84`, `api.xartists.art` NXDOMAIN, studio 503, trading faux. Le verdict « vitrine live / commerce fermé » ne change pas. Les SHA du 16 nov dans ce fichier sont historiques.

## Verdict

xArtists est une dApp **MultiversX mainnet** et une vitrine d'art. Ce n'est pas un fonds. Un pourboire n'est pas un investissement. Le wallet d'un visiteur n'est pas le wallet LIA Ops.

**Le site est en ligne. Le trading autonome ne l'est pas.** Un « go-live total » qui rallumerait LIA Ops, le slot REAL, le checkout PayBox, le mint live ou `claimFees` serait une erreur de contrôle. Cette analyse **refuse** cette ouverture.

| | |
| --- | --- |
| **Live** | https://xartists.art/ |
| **Musée** | https://xartists.art/museum/ |
| **Marché** | https://xartists.art/marketplace/ |
| **Studio** | https://xartists.art/studio/ |
| **xOrus** | https://xartists.art/intelligence/xorus/ |
| **Repo** | https://github.com/Neltud/xArtists |
| **Pages** | **0.139.0** · `5bf83162852840b6331f42ce1f59db4224e79a2c` · 15 nov 15:21 UTC · 140 routes · trading **faux** |
| **API** | HTTP 200 · SHA **`8b6fae84`** · 14 nov 05:04 UTC · **en retard** |
| **Studio store** | HTTP **503** · `backend=postgres` · schéma absent · raison non publiée |
| **xOrus** | paper · **ABSTAIN** · `thin_tape` · 16 nov 05:33 UTC |
| **Posture** | Vitrine **GO** — marché **lecture** — mint **dry-run** — fiat **fermé** — ops **gelées** |

Le SHA public des Pages prime sur toute version imprimée plus ancienne (0.136, 0.138, et le `7b280cc` du 14 nov au soir). L'API ne suit pas ce SHA. Les aligner est une opération de déploiement Render, pas une autorisation commerciale. Un commit git, même sur `main`, ne redéploie pas Render.

## Couches

| Couche | État au 16 nov 05:33 UTC | Limite |
| --- | --- | --- |
| Accueil, musée, exploration, lab 3D local | **GO** | Consultation. Le lab ne certifie pas un mesh. Header mobile sans badge langue (commit `5bf83162`) |
| Marketplace | **Lecture** | Cycle listing → escrow → receipt non prouvé (#428). L'historique #2 ne suffit pas |
| Originaux Drive | **Hors catalogue NFT** | Inventaire privé du 11 nov (291 PNG, 4 MP4). Pas 295 NFT. Pas d'URL de partage publique |
| Galerie 3D créateur | **Brouillon local** | Import JSON strict. Pas de publication |
| Studio / IPFS | **NO-GO** | 503, `table_ready=false`. Upload off. Cause SQL = logs Render seulement |
| Mint | **NO-GO live** | `mint_dry_run=true`, `mint_live_enabled=false`, dispatch off. `mint_oidc_pull_enabled=true` est un bras de lecture |
| xPortal | **NO-GO preuve** | #506, allowlist Reown + QR réel. Le code dApp n'a pas à changer pour ça |
| xOrus | **Paper** | Abstention `thin_tape`. Analyse privée off (#548). Ne pas écrire LIVE |
| Comptes email | **OFF** | Exploration sans wallet ≠ compte ≠ signataire |
| Fiat | **NO-GO** | Stripe off, MoonPay off. PayBox configuré, `paybox_mode=prod`, **checkout false** |
| Enchères / OpenSea / pont $TRO / Artprice | **OFF** | Drapeaux health tous faux ou non licenciés |
| Physique | **OFF** | `physical_works=off`, legacy lecture seule |
| CORS public | **OK apex** | Grant exact pour `https://xartists.art` et `https://neltud.github.io`. `www` = 301, pas de grant |
| Trésorerie | **Ne pas claimFees** | Destination historiquement nulle. Non re-sondée on-chain |
| OVH | **Parallèle** | PR #598 ouverte. Pas de bascule DNS |
| Vellum (Hatom, relayer gasless, Apple / Google Pay) | **Hors chemin** | Tant que wallet, Studio et un cycle marché ne sont pas prouvés |

## Dérive qui compte

Les Pages du 15 nov à 15:21 UTC servent `5bf83162` : correctif d'accessibilité du sélecteur de langue mobile, après l'isolement Drive (`7b280cc`, 14 nov) et le contrôle d'index quota Studio (#594, `7d313eac`). L'API health sert encore `8b6fae84`, un refresh news du **14 nov 05:04 UTC**, antérieur à #594. Conséquence : la vitrine et le backend ne décrivent pas le même commit, et le correctif Studio fusionné n'est **pas** celui qui répond en production.

On redéploie l'API **sans** changer `PAYBOX_*`, `MINT_*`, `LIA_*`, `CREATOR_MEDIA_UPLOAD_ENABLED` ni la base Studio.

`orders_backend=postgres` veut dire que des tables de commandes répondent. Ça ne veut pas dire qu'une commande a livré un NFT. `backend=postgres` sur le 503 Studio veut dire qu'une URL de base est présente et que le schéma créateur n'est pas prêt. Ça ne nomme pas l'hôte, et ça n'autorise pas la migration.

## Rupture ops — archive, non re-sondée le 16 nov

Le 30 octobre 2026, le signataire LIA Ops a enchaîné, contre la consigne de gel : des swaps xExchange, un retrait de liquidité TROMEX, une composition vers WEGLD, puis un transfert de **7,09 EGLD**. Hash : [`8ad06a59…0a0a`](https://explorer.multiversx.com/transactions/8ad06a590619824325bf382bb48fb2e8de13368f8ad8bb39f5f3bda9e52c0a0a).

Le solde résiduel cité le 1er nov (0,907888 EGLD, nonce 1487) **n'a pas été relu le 16 nov**. On ne le republie pas comme un chiffre frais. La règle tient : pas de nouvelle signature ops, pas de rechargement, pas de lecture de cette rafale comme un go-live.

Alternative, dans l'ordre : cesser de signer ; sortir le reste vers un cold ou un MPC si le signataire n'est pas sous contrôle exclusif ; seulement ensuite, et après maintien, une micro-transaction **utilisateur** journalisée.

## Veille — 16 novembre 2026

* **Prix et TVL.** DefiLlama, page chaîne datée du 16 nov : EGLD **2,62 $**, capitalisation **81,59 M$**, TVL **10,73 M$** (+1,82 % / 24 h), volume DEX 24 h **164 772 $**. Rebond modeste après le creux cité la veille. Ce n'est pas un signal d'entrée. xOrus, sur bougies horaires Binance EGLDUSDT non attestées, s'abstient (`thin_tape`, 6 signaux sur 120).
* **Liquidité.** Hatom protocole ~**8,9 M$** (encore −21 % sur 30 jours). xExchange ~**3,28 M$**. Le liquid staking Hatom (~2,2 M$ au 15 nov) est un sous-ensemble à ne pas additionner au total protocole. Un routeur de rendement traverserait un carnet mince. On ne le branche pas.
* **Corée.** Fenêtre Upbit **16–20 nov 2026** (notice `207379109`, prolongation du 23 oct). Le 16 nov au matin, nous sommes **dedans**. Aucune levée officielle relue. Les agrégateurs secondaires qui classent encore EGLD « sous surveillance » ne remplacent pas la notice Upbit. On ne publie pas une phrase sur la sûreté des dépôts.
* **Wallets.** Reown AppKit couvre QR, e-mail, social et SIWX. Utile après #506, inutile avant. Une passkey P-256 ne signe pas un compte MultiversX. Le project id public historique reste `e07ac8e2a212711609b21dade4c9e37f` sauf variable d'Actions déjà posée par l'opérateur.
* **Agents / Supernova.** La chaîne rapide est le terrain des agents. xArtists reste paper sur l'exécution. Un kit d'agents n'est pas une inscription de LIA.

## Sécurité — inchangée

* Pas de PEM, de seed, de JWT Pinata, de secret PSP dans un commit ou une capture.
* Pas de `VITE_LIA_LIVE_TRADING=1`.
* Pas de `claimFees`.
* Pas de slot forcé payable.
* Pas de mint public pendant que le dry-run est vrai.
* Pas de checkout pendant que `paybox_checkout_enabled` est faux, même si `paybox_mode` dit prod.
* Pas de fusion d'un brouillon commercial lu comme une autorisation (#478, #477, #430, #407 restent des drafts).
* Dependabot ouvert (#457, #458, #459, #596, #597) : revue batch, non bloquant, pas un go-live.

## Suite

[`SUITE_LOGIQUE_NOW.md`](SUITE_LOGIQUE_NOW.md).

Trois actions, dans cet ordre, et aucune autre :

1. Allowlist Reown `https://xartists.art` + `https://www.xartists.art`, puis QR xPortal réel commenté sur [#506](https://github.com/Neltud/xArtists/issues/506).
2. Hôte du `DATABASE_URL` (sans secret), backup, migrations 004 → 005 → 006, un CID relu.
3. Redéploiement Render de l'API déjà présente sur `main`, drapeaux inchangés, jusqu'à ce que `health.source_sha` dépasse `8b6fae84`.

---
hidden: true
noIndex: true
---

# Analyse DApp complète xArtists — 15 novembre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet** et une vitrine d'art. Ce n'est pas un fonds. Un pourboire n'est pas un investissement. Le wallet d'un visiteur n'est pas le wallet LIA Ops.

**Le site est en ligne. Le trading autonome ne l'est pas.** Un « go-live total » qui rallumerait LIA Ops, le slot REAL, le checkout PayBox ou `claimFees` serait une erreur de contrôle.

| | |
| --- | --- |
| **Live** | https://xartists.art/ |
| **Musée** | https://xartists.art/museum/ |
| **Marché** | https://xartists.art/marketplace/ |
| **Studio** | https://xartists.art/studio/ |
| **xOrus** | https://xartists.art/intelligence/xorus/ |
| **Repo** | https://github.com/Neltud/xArtists |
| **Pages** | **0.139.0** · `7b280ccf` · 14 nov 18:48 UTC · 140 routes · trading **faux** |
| **API** | HTTP 200 · SHA **`8b6fae84`** · 14 nov 05:04 UTC · **en retard d'environ 14 h** |
| **Studio store** | HTTP **503** · schéma absent |
| **Posture** | Vitrine **GO** — marché **lecture** — mint **dry-run** — fiat **fermé** — ops **gelées** |

Le SHA public des Pages prime sur toute version imprimée plus ancienne (0.136, 0.138). L'API ne suit pas encore ce SHA. Les aligner est une opération de déploiement, pas une autorisation commerciale.

## Couches

| Couche | État au 15 nov | Limite |
| --- | --- | --- |
| Accueil, musée, exploration, lab 3D local | **GO** | Consultation. Le lab ne certifie pas un mesh |
| Marketplace | **Lecture** | Cycle listing → escrow → receipt non prouvé (#428).  L'historique #2 ne suffit pas |
| Originaux Drive | **Hors catalogue NFT** | Inventaire privé du 11 nov (291 PNG, 4 MP4). Pas 295 NFT. Pas d'URL de partage publique |
| Galerie 3D créateur | **Brouillon local** | Import JSON strict, 64 Kio. Pas de publication |
| Studio / IPFS | **NO-GO** | 503, `table_ready=false`. Upload off |
| Mint | **NO-GO live** | `mint_dry_run=true`, `mint_live_enabled=false`, dispatch off. `mint_oidc_pull_enabled=true` est un bras de lecture |
| xPortal | **NO-GO preuve** | #506, allowlist Reown + QR réel |
| xOrus | **Paper** | Analyse privée off (#548). Ne pas écrire LIVE |
| Comptes email | **OFF** | Exploration sans wallet ≠ compte ≠ signataire |
| Fiat | **NO-GO** | Stripe off, MoonPay off. PayBox configuré, `paybox_mode=prod`, **checkout false** |
| Enchères / OpenSea / pont $TRO / Artprice | **OFF** | Drapeaux health tous faux ou non licenciés |
| Physique | **OFF** | `physical_works=off`, legacy lecture seule |
| Trésorerie | **Ne pas claimFees** | Destination historiquement nulle. Non re-sondée on-chain ce matin |
| OVH | **Parallèle** | Pas de bascule DNS |
| Vellum (Hatom, relayer gasless, Apple / Google Pay) | **Hors chemin** | Tant que wallet, Studio et un cycle marché ne sont pas prouvés |

## Dérive qui compte

Les Pages du 14 nov au soir embarquent l'isolement Drive → catalogue honnête (`7b280cc`). L'API health sert encore `8b6fae84`, un commit de refresh news du matin. Conséquence : la vitrine et le backend ne décrivent pas le même commit. On redéploie l'API **sans** changer `PAYBOX_*`, `MINT_*`, `LIA_*` ni la base Studio.

`orders_backend=postgres` veut dire que des tables de commandes répondent. Ça ne veut pas dire qu'une commande a livré un NFT.

## Rupture ops — archive, non re-sondée le 15 nov

Le 30 octobre 2026, le signataire LIA Ops a enchaîné, contre la consigne de gel : des swaps xExchange, un retrait de liquidité TROMEX, une composition vers WEGLD, puis un transfert de **7,09 EGLD**. Hash : [`8ad06a59…0a0a`](https://explorer.multiversx.com/transactions/8ad06a590619824325bf382bb48fb2e8de13368f8ad8bb39f5f3bda9e52c0a0a).

Le solde résiduel cité le 1er nov (0,907888 EGLD, nonce 1487) **n'a pas été relu le 15 nov**. On ne le republie pas comme un chiffre frais. La règle, elle, tient : pas de nouvelle signature ops, pas de rechargement, pas de lecture de cette rafale comme un go-live.

Alternative, dans l'ordre : cesser de signer ; sortir le reste vers un cold ou un MPC si le signataire n'est pas sous contrôle exclusif ; seulement ensuite, et après maintien, une micro-transaction **utilisateur** journalisée.

## Veille

* **Prix.** EGLD autour de **2,5–2,6 $** le 15 nov au matin (DefiLlama). TVL chaîne **10,51 M$**. Ce n'est pas le régime des 3,4 $ du 1er nov, et ce n'est pas non plus un motif de trade.
* **Corée.** Fenêtre Upbit **16–20 nov 2026** ouverte par la notice du 23 oct. Aucune levée relue aujourd'hui. Bithumb partageait la même fenêtre annoncée en octobre. On relit les notices officielles avant toute phrase publique sur les dépôts.
* **Supernova / agents.** La chaîne rapide est le terrain des agents. xArtists reste paper sur l'exécution. MX-8004 et un kit d'agents ne sont pas une inscription de LIA.
* **Wallets.** Reown AppKit couvre QR, e-mail, social et SIWX. Utile après #506, inutile avant. Une passkey P-256 (EIP-7951, Ethereum) ne signe pas un compte MultiversX.
* **Liquidité.** Hatom porte l'essentiel de la TVL et baisse sur 30 jours. Un orchestrateur de rendement qui traverserait Hatom / xExchange aujourd'hui optimiserait du slippage sur un marché mince. On ne le branche pas.

## Sécurité — inchangée

* Pas de PEM, de seed, de JWT Pinata, de secret PSP dans un commit ou une capture.
* Pas de `VITE_LIA_LIVE_TRADING=1`.
* Pas de `claimFees`.
* Pas de slot forcé payable.
* Pas de mint public pendant que le dry-run est vrai.
* Pas de checkout pendant que `paybox_checkout_enabled` est faux, même si `paybox_mode` dit prod.
* Pas de fusion d'un brouillon commercial lu comme une autorisation.

## Suite

[`SUITE_LOGIQUE_NOW.md`](SUITE_LOGIQUE_NOW.md).

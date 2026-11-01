---
hidden: true
noIndex: true
---

# Analyse DApp complète xArtists — 1er novembre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops.

**Le site est en ligne. Le trading autonome ne l’est pas.** Un « go-live total » qui rallumerait LIA Ops, le slot REAL, Paybox prod ou `claimFees` serait une erreur de contrôle, pas une mise en production.

`static.yml` pose `VITE_LIA_LIVE_TRADING` à **0** sauf variable de dépôt explicite. Même à 1, ce drapeau n’est qu’une micro-signature **xPortal** (caps), jamais un PEM et jamais le wallet ops. Paybox UI est **fail-closed**. Le rail Render reste **preprod**.

**Upbit** (notice `207379109`, 23 oct 06:02 UTC) prolonge la surveillance EGLD jusqu’au **16–20 novembre 2026**. Aucun message `@Official_Upbit` de levée depuis cette notice (contrôle 1er nov). **Bithumb** : prochaine annonce EGLD le **16–20 nov**. La fenêtre **FET (2–6 nov)** n’est pas la même porte. Dernier statut wallet Upbit observé (30 oct, non revu le 1er nov) : **retraits ouverts, dépôts bloqués**, désignation toujours affichée.

Au probe **1er nov 05:48 UTC** : jour **9/29**, **15 jours** avant le 16 nov, **20 jours** avant le 21 nov 00:00 UTC.

| | |
| --- | --- |
| **Live** | https://neltud.github.io/xArtists/ |
| **GO_LIVE** | https://neltud.github.io/xArtists/#/go-live |
| **Packs** | https://neltud.github.io/xArtists/#/agents |
| **Musée** | https://neltud.github.io/xArtists/#/museum |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **Site public** — trading **paper** — LIA Ops **à ne plus signer** — spin REAL **fermé** — Paybox UI **fermé** |
| **Indexer** | healthy · epoch **2280** · refreshRate **600** · rounds **78106** / 144000 |
| **Supernova** | LIVE depuis le 10 sept 2026 (epoch 2233) · **+47 epochs** |
| **EGLD** | **$3,44** · mcap **$106,92M** · circ 31,08M · staked 13,90M · APR **9,12 %** |
| **LIA Ops** | **0,907888 EGLD** · nonce **1487** · dernière TX **30 oct 17:29 UTC** |
| **Slot** | **0,5000 EGLD** · hash inchangé · `isPayable=false` · REAL fermé |
| **Market** | **0,0175 EGLD** · hash inchangé · payable · acheter seulement **#2** |
| **Agents SC** | **0,013 EGLD** · non payable par SC · packs **10 / 5 / 2,5** |
| **$TRO** | `TRO-94c925` · circ **476 224** · **561** comptes · ~$0.00008223 · mcap **~$39,16** · 2815 tx |
| **Build** | stamp Pages **0.126.0** · LIA default **0** · Paybox default off |

***

## Rupture ops — fait, pas une opinion

Entre le probe du **30 oct 05:36 UTC** (nonce 1479, 1,585598 EGLD, « figé depuis le 17 oct ») et celui du **1er nov**, le signataire LIA Ops a exécuté une rafale de 9 minutes :

1. Cinq `xo` xExchange (USDC, HTM, MEX, XOXNO, stables/ASH).
2. `removeLiquidity` sur le LP **TROMEX** (sortie de pool $TRO/MEX).
3. `composeTasks` MEX → WEGLD.
4. Transfert **7,09 EGLD** vers `erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l`, owner du token `$TRO`.

Hash du transfert : [`8ad06a59…0a0a`](https://explorer.multiversx.com/transactions/8ad06a590619824325bf382bb48fb2e8de13368f8ad8bb39f5f3bda9e52c0a0a).

Le hot wallet est passé de **1,585598** à **0,907888 EGLD**. Le code du site ne signe pas ces appels. Le gel était une règle d’opération, pas un verrou de clé. **Conséquence** : tant que la revue KR n’est pas levée par une notice de maintien, aucune nouvelle signature ops, aucun rechargement, aucune lecture de cette rafale comme un « test de go-live réussi ».

Alternative de sécurisation, dans l’ordre : (1) cesser de signer, (2) sortir le reste du hot wallet vers un cold / MPC si le signataire n’est pas sous contrôle exclusif, (3) seulement après maintien KR, une micro-TX **utilisateur** journalisée — pas un nouvel `xo` ops.

***

## Couches produit

| Layer | Rôle | État 1er nov |
| --- | --- | --- |
| Studio / Gallery | NFT (NFTUDURI + musée) | Lecture API + musée immersif — surface de go-live |
| Marketplace | List / Buy / Bid | SC live · escrow `ASFT-a6273a-01` · id **#2** seulement |
| Agents | Pulse · Yield · Sentinel | SC live · 10 / 5 / 2,5 EGLD · fiat 110 / 75 / 50 € **non encaissable** |
| LIA | Copilote | Défaut paper. Ops a tradé le 30 oct au soir **contre** la consigne. Mandat trading **suspendu**. |
| $TRO | Utility | Illiquide (561 comptes). 2815 tx. La sortie LP TROMEX réduit encore la profondeur, elle ne crée pas un marché. |
| Slot | Primordial | House 0,5 · REAL fermé · compte non payable |
| Treasury | Split fees | codeHash live · **destination null** · balance 0 · ne pas `claimFees` |
| Checkout fiat | Paybox / quote Rule 1 | HMAC/IPN en repo. UI fail-closed. Render **preprod**. PR Neon **non mergée** |
| Vellum (Hatom, relayer gasless, Apple/Google Pay) | Abstraction | **Hors chemin critique** tant que la notice KR n’est pas une levée. |

***

## Veille technologique (1er nov 2026, 05:48 UTC)

### Corée — bloquant n°1

* **Upbit**, 23 oct 06:02 UTC : warning MultiversX (EGLD/KRW, EGLD/BTC, EGLD/USDT) jusqu’à la **3ᵉ semaine de novembre (16–20 nov)**. Notice : https://www.upbit.com/service_center/notice?id=207379109. Toujours la référence. Pas de notice suivante trouvée.
* **Bithumb**, 23 oct : EGLD **et** FET. Annonce EGLD **16–20 nov**. FET **2–6 nov**. Ce ne sont pas la même décision. EGLD n’est pas dans les delist déjà décidés (SOPH / ZIL).
* Le prix a remonté de **$3,21** (30 oct matin, API `/economics`) à **$3,44**. Mcap ~$106,92M. Contexte. Pas un signal.
* Conséquence produit : **aucun nouveau trade LIA Ops**. Le site (galerie, musée, market en lecture, packs) est le seul go-live.

### MultiversX

* Supernova 600 ms stable. Epoch **2280** (2278 le 30 oct). Rien de protocole à shipper.
* API publique : `/stats`, `/economics`, `/accounts`, `/tokens/TRO-94c925` répondent. Hashes agents / market / slot / treasury **identiques** au 30 oct.
* Market payable. Agents, slot, treasury **non** payables par smart contract. Slot rejette toujours l’EGLD.
* Front : `@multiversx/sdk-dapp` ^3, Vite 5, Node **20** sur le runner Pages. Ne pas merger Vite 8 / ESLint 10 sans QA.

### NFT / agents / fiat

* MX-8004 : LIA non inscrit. Après une annonce de maintien seulement.
* Paybox : UI fermée par défaut. `PAYBOX_ENV=prod` = NO-GO tant que la carte test + IPN + My Packs ne sont pas verts.
* Acheter un pack en EGLD dépense 10 / 5 / 2,5 vrais EGLD. Paper mint = DEV only.
* [PR #200](https://github.com/Neltud/xArtists/pull/200) laissée ouverte. Lockfile `access-api` cassé.
* [PR #221](https://github.com/Neltud/xArtists/pull/221) release-please 0.126.0 : ne pas la confondre avec ce stamp manuel, ne pas la merger pour publier.

***

## Ce passage (0.126.0)

1. Le fallback réseau et les JSON publics servent le probe du **1er nov** (epoch 2280, EGLD $3,44, LIA 0,907888 / nonce 1487). Plus le chrome du 30 oct.
2. La copie `/go-live` dit le défaut workflow à 0, la rupture du 30 oct 17:29, et que la fenêtre FET n’est pas une levée.
3. `BUILD_ID.txt` rattrape le stamp (il était resté sur 0.124.0 alors que `package.json` disait 0.125.0).
4. `static.yml` copie `dist/` vers `_site/` **depuis la racine**. L’étape précédente restait dans `apps/frontend` et cherchait `apps/frontend/dist` au mauvais endroit — le prochain Pages aurait pu publier un artifact vide.
5. Ce push change du TypeScript et du JSON, donc `static.yml` part. Les markdown seuls ne déclenchent pas le workflow (`paths-ignore`).

***

## Sécurité — inchangé, plus un fait nouveau

* Ne pas committer `VITE_*_CODEHASH_OK=1`.
* Ne pas financer les placeholders legacy vides.
* Ne pas `claimFees`.
* Ne pas forcer le slot payable.
* Ne pas coller de PEM. Ne pas annoncer un fonds retail.
* Ne pas traiter « le site est déployé », « EGLD a repris », « FET est examiné cette semaine », « le nonce a bougé donc le live est ouvert » comme une autorisation.
* Ne pas merger la PR #200 en l’état.
* **Ne pas signer une neuvième transaction LIA Ops.**

***

## Suite

Voir [`SUITE_LOGIQUE_NOW.md`](SUITE_LOGIQUE_NOW.md).

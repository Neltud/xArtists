---
hidden: true
noIndex: true
---

# Analyse DApp complète xArtists — 25 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. Le **client** force `VITE_LIA_LIVE_TRADING=0`.

**Le site est en ligne. Le trading ne l’est pas.** Upbit (notice `207379109`, 23 oct 06:02 UTC) a prolongé la surveillance EGLD jusqu’au **16–20 novembre 2026**. Bithumb a prolongé le warning EGLD (et FET) le même jour. Aucune notice de reprise des retraits Upbit (suspendus le 21 oct 20:00 KST) n’est indexée au 25 oct. Au probe : **22 jours** avant le 16 nov, **27 jours** avant le 21 nov 00:00 UTC.

Probe API du **25 oct \~04:45 UTC**. CodeHash agents inchangé (`igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`). `getPackPrice` **10 / 5 / 2.5** EGLD. Market et slot : hashes inchangés. Treasury dest toujours null. LIA Ops nonce **1479** figé. Le JSON public servait encore le solde d’avant ces swaps (1,603782 EGLD, nonce 1473) : corrigé.

|               |                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------- |
| **Live**      | https://neltud.github.io/xArtists/                                                       |
| **GO\_LIVE**  | https://neltud.github.io/xArtists/#/go-live                                              |
| **Packs**     | https://neltud.github.io/xArtists/#/agents                                               |
| **Musée**     | https://neltud.github.io/xArtists/#/museum                                               |
| **Repo**      | https://github.com/Neltud/xArtists                                                       |
| **Posture**   | **Site public en lecture** — LIA **client paper** — spin REAL **fermé** — Paybox **501** |
| **Indexer**   | healthy · epoch **2273** · refreshRate **600**                                           |
| **Supernova** | LIVE depuis le 10 sept 2026 (epoch 2233) · **+40 epochs**                                |
| **EGLD**      | **$3,30** · mcap **$102,4M** · circ 31,03M · staked 13,92M · APR **9,07 %**              |
| **LIA Ops**   | **1,585598 EGLD** · nonce **1479** (aucune TX depuis le 17 oct)                          |
| **Slot**      | **0,5000 EGLD** · hash inchangé · REAL fermé                                             |
| **Market**    | **0,0175 EGLD** · hash inchangé · acheter seulement l’id actif (**#2**)                  |
| **Agents SC** | **0,013 EGLD** · `getPackPrice` **10 / 5 / 2.5**                                         |
| **$TRO**      | `TRO-94c925` · circ **476 224** · **562** comptes · \~$0,0000807 · mcap **\~$38**        |
| **Build**     | stamp Pages **0.121.0** · `VITE_LIA_LIVE_TRADING=0`                                      |

***

## Couches produit

| Layer            | Rôle                     | État 25 oct                                                                   |
| ---------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Studio / Gallery | NFT (NFTUDURI + musée)   | Lecture API + musée immersif                                                  |
| Marketplace      | List / Buy / Bid         | SC live · escrow `ASFT-a6273a-01` · id **#2** seulement · pas de prix inventé |
| Agents           | Pulse · Yield · Sentinel | SC live · 10 / 5 / 2,5 EGLD · fiat 110 / 75 / 50 € **non encaissable**        |
| LIA              | Copilote                 | **Client paper**. Wallet ops a tradé le 17 oct seulement                      |
| $TRO             | Utility                  | Illiquide (562 comptes). Pas une preuve visiteur nouvelle                     |
| Slot             | Primordial               | House 0,5 · REAL fermé                                                        |
| Treasury         | Split fees               | codeHash live · **destination null** · balance 0                              |
| Carte entité     | Référence ops            | API live. Repli JSON aligné sur le probe, plus sur le 17 oct                  |

***

## Veille technologique (25 oct \~04:45 UTC)

### Corée — bloquant n°1, toujours une prolongation

* **Upbit**, 23 oct 06:02 UTC : « investment warning » MultiversX (EGLD/KRW, EGLD/BTC, EGLD/USDT) étendu jusqu’à la **3ᵉ semaine de novembre 2026 (16–20 nov)**. Notice : https://www.upbit.com/service\_center/notice?id=207379109
* **Bithumb**, 23 oct : warning EGLD **et FET** prolongé. EGLD n’est pas dans les delist déjà décidés (SOPH / ZIL).
* Retraits EGLD Upbit suspendus le 21 oct 20:00 KST pour un upgrade réseau. Pas de notice de reprise trouvée le 25 oct. Reprise des retraits ≠ levée du warning.
* EGLD **$3,30** (API `/economics`), sous les $3,46 du 24 oct et les \~$3,73 du 21 oct. Mcap \~$102,4M. RSI quotidien autour de 30 sur des agrégateurs tiers : contexte, pas un signal d’exécution.
* Conséquence produit : **aucun nouveau trade live LIA**, même micro. Le site (galerie, musée, market en lecture, packs) reste public.

### MultiversX

* Supernova 600 ms stable. Epoch **2273** (2272 le 24 oct, 2265 le 17 oct). Rien de protocole à shipper.
* API publique : `/stats`, `/economics`, `/accounts`, `/tokens/TRO-94c925`, `vm-values/query` `getPackPrice` répondent. Packs confirmés **10 / 5 / 2.5**.
* Front : `@multiversx/sdk-dapp` ^3, Vite 5, Node **20** sur le runner Pages. Ne pas merger les majors Dependabot (Vite 8, ESLint 10) sans QA.
* Stack Vellum (Hatom, orchestrateur multi-chain, relayer gasless) reste **hors chemin critique** tant que la revue KR n’est pas levée par une annonce de maintien.

### Wallet ops (à ne pas confondre avec le client)

Le 17 oct 12:57–13:02 UTC, `erd1p4zyy…qu0crn6` a signé wrap / addLiquidity ×2 / swap / multiPairSwap / xo. Nonce **1479** inchangé le 25 oct. Solde **1,585598 EGLD**. Ces TX n’autorisent pas un nouveau live. L’ancienne carte entité montrait encore 1,603782 / nonce 1473.

### NFT / agents / fiat

* MX-8004 : LIA non inscrit. Après une annonce de maintien seulement.
* Paybox : module HMAC/IPN fail-closed en repo. **501** tant que les secrets preprod + preuve IPN + mint ne sont pas faits. `VITE_PAYBOX_ENABLED=false` dans `static.yml`. Stripe fail-closed.
* Acheter un pack en EGLD dépense 10 / 5 / 2,5 vrais EGLD. Paper mint = DEV only.

***

## Ce passage (0.121.0)

1. `/go-live` sépare **go-live site** et **go-live trading**, et affiche les jours restants avant le 16 nov et le 21 nov.
2. `upbitPosture` garde `extended` jusqu’au 21 nov 00:00 UTC. Le compteur « jour N/29 » reste en tranches de 24 h depuis le post Upbit, et la phrase le dit.
3. La carte entité lit `/economics` et le compte LIA. Le JSON de repli et le fallback réseau sont le probe du 25 oct, plus celui du 17 oct.
4. Stamp Pages **0.121.0**. `VITE_LIA_LIVE_TRADING` reste **0**.

***

## Sécurité — inchangé

* Ne pas committer `VITE_*_CODEHASH_OK=1`.
* Ne pas financer les placeholders legacy vides.
* Ne pas `claimFees` (destination trésorerie null).
* Ne pas forcer le slot payable : le compte rejette l’EGLD.
* Ne pas coller de PEM. Ne pas annoncer un fonds retail.
* Ne pas interpréter « la date du 23 oct est passée » ni « le site est déployé » comme une autorisation de trade.

***

## Suite

Voir [`SUITE_LOGIQUE_NOW.md`](SUITE_LOGIQUE_NOW.md).

---
hidden: true
noIndex: true
---

# Analyse DApp complète xArtists — 27 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. Le **client** force `VITE_LIA_LIVE_TRADING=0`.

**Le site est en ligne. Le trading ne l’est pas.** Upbit (notice `207379109`, 23 oct 06:02 UTC) a prolongé la surveillance EGLD jusqu’au **16–20 novembre 2026**. Bithumb a prolongé le warning EGLD (et FET) le même jour. La prochaine fenêtre FET (**2–6 nov**) ne lève pas EGLD. Aucune notice de levée EGLD, ni de reprise des retraits Upbit (suspendus le 21 oct 20:00 KST), n’est indexée au 27 oct 05:35 UTC. Une notice INIT du 26 oct est un autre actif. Au probe : **jour 4/29**, **20 jours** avant le 16 nov, **25 jours** avant le 21 nov 00:00 UTC.

Probe API du **27 oct ~05:35 UTC**. CodeHash agents inchangé (`igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`). Market et slot : hashes inchangés. Treasury dest toujours null. LIA Ops nonce **1479** figé. Solde **1.585598 EGLD**.

|               |                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------- |
| **Live**      | https://neltud.github.io/xArtists/                                                       |
| **GO_LIVE**   | https://neltud.github.io/xArtists/#/go-live                                              |
| **Packs**     | https://neltud.github.io/xArtists/#/agents                                               |
| **Musée**     | https://neltud.github.io/xArtists/#/museum                                               |
| **Repo**      | https://github.com/Neltud/xArtists                                                       |
| **Posture**   | **Site public en lecture** — LIA **client paper** — spin REAL **fermé** — Paybox **501** |
| **Indexer**   | healthy · epoch **2275** · refreshRate **600**                                           |
| **Supernova** | LIVE depuis le 10 sept 2026 (epoch 2233) · **+42 epochs**                                |
| **EGLD**      | **$3,22** · mcap **$99,97M** · circ 31,05M · staked 13,89M · APR **9,09 %**              |
| **LIA Ops**   | **1.585598 EGLD** · nonce **1479** (aucune TX depuis le 17 oct)                          |
| **Slot**      | **0,5000 EGLD** · hash inchangé · REAL fermé                                             |
| **Market**    | **0,0175 EGLD** · hash inchangé · acheter seulement l’id actif (**#2**)                  |
| **Agents SC** | **0,013 EGLD** · packs **10 / 5 / 2,5**                                                  |
| **$TRO**      | `TRO-94c925` · circ **476 224** · **562** comptes · ~$0.0000809 · mcap **~$38,5**        |
| **Build**     | stamp Pages **0.123.0** · `VITE_LIA_LIVE_TRADING=0`                                      |

***

## Couches produit

| Layer            | Rôle                     | État 27 oct                                                                   |
| ---------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Studio / Gallery | NFT (NFTUDURI + musée)   | Lecture API + musée immersif                                                  |
| Marketplace      | List / Buy / Bid         | SC live · escrow `ASFT-a6273a-01` · id **#2** seulement · pas de prix inventé |
| Agents           | Pulse · Yield · Sentinel | SC live · 10 / 5 / 2,5 EGLD · fiat 110 / 75 / 50 € **non encaissable**        |
| LIA              | Copilote                 | **Client paper**. Wallet ops a tradé le 17 oct seulement                      |
| $TRO             | Utility                  | Illiquide (562 comptes). Pas une preuve visiteur nouvelle                     |
| Slot             | Primordial               | House 0,5 · REAL fermé                                                        |
| Treasury         | Split fees               | codeHash live · **destination null** · balance 0                              |
| Carte entité     | Référence ops            | API live. Repli JSON = probe du 27 oct                                        |

***

## Veille technologique (27 oct ~05:35 UTC)

### Corée — bloquant n°1, toujours une prolongation

* **Upbit**, 23 oct 06:02 UTC : « investment warning » MultiversX (EGLD/KRW, EGLD/BTC, EGLD/USDT) étendu jusqu’à la **3ᵉ semaine de novembre 2026 (16–20 nov)**. Notice : https://www.upbit.com/service_center/notice?id=207379109
* **Bithumb**, 23 oct : warning EGLD **et FET** prolongé. Prochaine annonce EGLD : **16–20 nov**. FET : **2–6 nov**. Ce ne sont pas la même porte. EGLD n’est pas dans les delist déjà décidés (SOPH / ZIL).
* Retraits EGLD Upbit suspendus le 21 oct 20:00 KST pour un upgrade réseau. Pas de notice de reprise trouvée le 27 oct. Reprise des retraits ≠ levée du warning.
* Notice Upbit du 26 oct sur **INIT** (revue 23–27 nov) : autre actif. Ne pas la lire comme un signal EGLD.
* EGLD **$3,22** (API `/economics`), sous les $3,23 du 26 oct. Mcap ~$99,97M. Contexte de prix, pas un signal d’exécution.
* Conséquence produit : **aucun nouveau trade live LIA**, même micro. Le site (galerie, musée, market en lecture, packs) reste public.

### MultiversX

* Supernova 600 ms stable. Epoch **2275** (2274 le 26 oct, 2265 le 17 oct). Rien de protocole à shipper.
* API publique : `/stats`, `/economics`, `/accounts`, `/tokens/TRO-94c925` répondent. Hashes agents / market / slot **identiques** au 26 oct.
* Front : `@multiversx/sdk-dapp` ^3, Vite 5, Node **20** sur le runner Pages. Ne pas merger les majors Dependabot (Vite 8, ESLint 10) sans QA.
* Stack Vellum (Hatom, orchestrateur multi-chain, relayer gasless) reste **hors chemin critique** tant que la revue KR n’est pas levée par une annonce de maintien.

### Wallet ops (à ne pas confondre avec le client)

Le 17 oct 12:57–13:02 UTC, `erd1p4zyy…qu0crn6` a signé wrap / addLiquidity ×2 / swap / multiPairSwap / xo. Nonce **1479** inchangé le 27 oct. Solde **1.585598 EGLD** (atomique `1585597751483049510`). Ces TX n’autorisent pas un nouveau live.

### NFT / agents / fiat

* MX-8004 : LIA non inscrit. Après une annonce de maintien seulement.
* Paybox : module HMAC/IPN fail-closed en repo. **501** tant que les secrets preprod + preuve IPN + mint ne sont pas faits. `VITE_PAYBOX_ENABLED=false` dans `static.yml`. Stripe fail-closed.
* Acheter un pack en EGLD dépense 10 / 5 / 2,5 vrais EGLD. Paper mint = DEV only.

***

## Ce passage (0.123.0)

1. Le fallback réseau et les JSON publics ne servent plus le probe du 26 oct (epoch 2274, EGLD $3,23). Ils servent le probe du 27 oct.
2. Le verdict `marketplace_mainnet` ne présente plus le listing #2 comme un prix vivant de 0,25 EGLD. Cette valeur est une preuve historique, pas le solde **0,0175**.
3. `upbitPosture` reste `extended` jusqu’au 21 nov 00:00 UTC. Le compteur est calculé dans le client, pas figé dans le bundle.
4. Stamp Pages **0.123.0**. `VITE_LIA_LIVE_TRADING` reste **0**.

***

## Sécurité — inchangé

* Ne pas committer `VITE_*_CODEHASH_OK=1`.
* Ne pas financer les placeholders legacy vides.
* Ne pas `claimFees` (destination trésorerie null).
* Ne pas forcer le slot payable : le compte rejette l’EGLD.
* Ne pas coller de PEM. Ne pas annoncer un fonds retail.
* Ne pas interpréter « la date du 23 oct est passée », « le site est déployé », « une annonce FET arrive début novembre » ou « un autre ticker est en revue » comme une autorisation de trade.

***

## Suite

Voir [`SUITE_LOGIQUE_NOW.md`](SUITE_LOGIQUE_NOW.md).

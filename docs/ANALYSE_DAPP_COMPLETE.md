---
hidden: true
noIndex: true
---

# Analyse DApp complète xArtists — 28 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. Le **client** force `VITE_LIA_LIVE_TRADING=0` dans `static.yml`. Paybox est forcé à `false`.

**Le site est en ligne. Le trading ne l’est pas.** Upbit (notice `207379109`, 23 oct 06:02 UTC) a prolongé la surveillance EGLD jusqu’au **16–20 novembre 2026**. Bithumb a prolongé le warning EGLD (et FET) le même jour. La prochaine fenêtre FET (**2–6 nov**) ne lève pas EGLD. Aucune notice de levée EGLD, ni de reprise des retraits Upbit (suspendus le 21 oct 20:00 KST), n’est indexée au **28 oct 06:15 UTC**. Au probe : **jour 6/29**, **19 jours** avant le 16 nov, **24 jours** avant le 21 nov 00:00 UTC. Le client recalcule ces chiffres.

Probe API du **28 oct 06:14:47 UTC**. CodeHash agents inchangé (`igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`). Market et slot : hashes inchangés. LIA Ops nonce **1479** figé. Solde **1.585598 EGLD**.

|               |                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------- |
| **Live**      | https://neltud.github.io/xArtists/                                                       |
| **GO_LIVE**   | https://neltud.github.io/xArtists/#/go-live                                              |
| **Packs**     | https://neltud.github.io/xArtists/#/agents                                               |
| **Musée**     | https://neltud.github.io/xArtists/#/museum                                               |
| **Repo**      | https://github.com/Neltud/xArtists                                                       |
| **Posture**   | **Site public en lecture** — LIA **client paper** — spin REAL **fermé** — Paybox **501** |
| **Indexer**   | healthy · epoch **2276** · refreshRate **600** · rounds **81955** / 144000               |
| **Supernova** | LIVE depuis le 10 sept 2026 (epoch 2233) · **+43 epochs**                                |
| **EGLD**      | **$3,37** · mcap **$104,65M** · circ 31,05M · staked 13,88M · APR **9,15 %**             |
| **LIA Ops**   | **1.585598 EGLD** · nonce **1479** (aucune TX depuis le 17 oct)                          |
| **Slot**      | **0,5000 EGLD** · hash inchangé · `isPayable=false` · REAL fermé                         |
| **Market**    | **0,0175 EGLD** · hash inchangé · payable · acheter seulement l’id actif (**#2**)        |
| **Agents SC** | **0,013 EGLD** · non payable par SC · packs **10 / 5 / 2,5**                             |
| **$TRO**      | `TRO-94c925` · circ **476 224** · **562** comptes · ~$0.0000837 · mcap **~$39,88** · 2814 tx |
| **Build**     | stamp Pages **0.124.0** · `VITE_LIA_LIVE_TRADING=0`                                      |

***

## Couches produit

| Layer            | Rôle                     | État 28 oct                                                                   |
| ---------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Studio / Gallery | NFT (NFTUDURI + musée)   | Lecture API + musée immersif                                                  |
| Marketplace      | List / Buy / Bid         | SC live · escrow `ASFT-a6273a-01` · id **#2** seulement · pas de prix inventé |
| Agents           | Pulse · Yield · Sentinel | SC live · 10 / 5 / 2,5 EGLD · fiat 110 / 75 / 50 € **non encaissable**        |
| LIA              | Copilote                 | **Client paper**. Wallet ops a tradé le 17 oct seulement                      |
| $TRO             | Utility                  | Illiquide (562 comptes). +1 tx depuis le 27 oct, pas une preuve visiteur      |
| Slot             | Primordial               | House 0,5 · REAL fermé · compte non payable                                   |
| Treasury         | Split fees               | codeHash live · **destination null** · balance 0 · ne pas `claimFees`         |
| Carte entité     | Référence ops            | API live. Repli JSON = probe du 28 oct                                        |
| Checkout fiat    | Paybox / quote Rule 1    | Spec + HMAC/IPN fail-closed. **501**. PR Neon **non mergée**                  |

***

## Veille technologique (28 oct 06:15 UTC)

### Corée — bloquant n°1, toujours une prolongation

* **Upbit**, 23 oct 06:02 UTC : « investment warning » MultiversX (EGLD/KRW, EGLD/BTC, EGLD/USDT) étendu jusqu’à la **3ᵉ semaine de novembre 2026 (16–20 nov)**. Notice : https://www.upbit.com/service_center/notice?id=207379109 — toujours la notice de référence. Aucune levée publiée depuis.
* **Bithumb**, 23 oct : warning EGLD **et FET** prolongé. Prochaine annonce EGLD : **16–20 nov**. FET : **2–6 nov**. Ce ne sont pas la même porte. EGLD n’est pas dans les delist déjà décidés (SOPH / ZIL).
* Retraits EGLD Upbit suspendus le 21 oct 20:00 KST pour un upgrade réseau. Pas de notice de reprise trouvée le 28 oct. Reprise des retraits ≠ levée du warning.
* Notice Upbit sur **INIT** : autre actif. Ne pas la lire comme un signal EGLD.
* EGLD **$3,37** (API `/economics`), au-dessus des $3,22 du 27 oct. Mcap ~$104,65M. Contexte de prix, pas un signal d’exécution.
* Conséquence produit : **aucun nouveau trade live LIA**, même micro. Le site (galerie, musée, market en lecture, packs) reste public. C’est le seul go-live autorisé.

### MultiversX

* Supernova 600 ms stable. Epoch **2276** (2275 le 27 oct, 2274 le 26 oct, 2265 le 17 oct). Rien de protocole à shipper.
* API publique : `/stats`, `/economics`, `/accounts`, `/tokens/TRO-94c925` répondent. Hashes agents / market / slot / staking / venue / treasury **identiques** au 27 oct.
* Comptes : market payable, agents / slot / treasury **non** payables par smart contract. Slot rejette toujours l’EGLD.
* Front : `@multiversx/sdk-dapp` ^3, Vite 5, Node **20** sur le runner Pages. Ne pas merger les majors Dependabot (Vite 8, ESLint 10) sans QA.
* Stack Vellum (Hatom, orchestrateur multi-chain, relayer gasless, Apple/Google Pay) reste **hors chemin critique** tant que la revue KR n’est pas levée par une annonce de maintien **et** une reprise des retraits.

### Wallet ops (à ne pas confondre avec le client)

Le 17 oct 12:57–13:02 UTC, `erd1p4zyy…qu0crn6` a signé wrap / addLiquidity ×2 / swap / multiPairSwap / xo. Nonce **1479** inchangé le 28 oct. Solde **1.585598 EGLD** (atomique `1585597751483049510`). Ces TX n’autorisent pas un nouveau live.

### NFT / agents / fiat

* MX-8004 : LIA non inscrit. Après une annonce de maintien seulement.
* Paybox : module HMAC/IPN fail-closed en repo. **501** tant que les secrets preprod + preuve IPN + mint ne sont pas faits. `VITE_PAYBOX_ENABLED=false` dans `static.yml`. Stripe fail-closed.
* Acheter un pack en EGLD dépense 10 / 5 / 2,5 vrais EGLD. Paper mint = DEV only.
* [PR #200](https://github.com/Neltud/xArtists/pull/200) (store commandes Neon) : **laissée ouverte, non mergée**. La base est en retard sur `main`, l’état est `unstable`, et le lockfile `access-api` est réduit à l’identité du paquet. `npm ci` du workflow Pages casserait. Le store Neon n’est pas le prochain pas tant que Paybox reste 501 et que la revue KR tient.

***

## Ce passage (0.124.0)

1. Le fallback réseau et les JSON publics (`docs/data`, `data/`, `apps/frontend/public/data`) ne servent plus le probe du 27 oct (epoch 2275, EGLD $3,22). Ils servent le probe du 28 oct.
2. Le verdict marketplace ne présente toujours pas le listing #2 comme un prix vivant de 0,25 EGLD. Solde market **0,0175**.
3. `upbitPosture` reste `extended` jusqu’au 21 nov 00:00 UTC. Le compteur est calculé dans le client.
4. Stamp Pages **0.124.0**. `package.json` frontend aligné pour que `npm ci` reste synchrone. `VITE_LIA_LIVE_TRADING` reste **0**.
5. Ce push déclenche `static.yml` (fichiers non markdown). Les `.md` seuls sont ignorés par le workflow ; le code et les JSON publics ne le sont pas.

***

## Sécurité — inchangé

* Ne pas committer `VITE_*_CODEHASH_OK=1`.
* Ne pas financer les placeholders legacy vides.
* Ne pas `claimFees` (destination trésorerie null).
* Ne pas forcer le slot payable : le compte rejette l’EGLD.
* Ne pas coller de PEM. Ne pas annoncer un fonds retail.
* Ne pas interpréter « la date du 23 oct est passée », « le site est déployé », « EGLD a repris $0,15 », « une annonce FET arrive début novembre » ou « un autre ticker est en revue » comme une autorisation de trade.
* Ne pas merger la PR #200 en l’état.

***

## Suite

Voir [`SUITE_LOGIQUE_NOW.md`](SUITE_LOGIQUE_NOW.md).

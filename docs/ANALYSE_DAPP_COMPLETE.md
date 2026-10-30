---
hidden: true
noIndex: true
---

# Analyse DApp complète xArtists — 30 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. Le build Pages arme `VITE_LIA_LIVE_TRADING` pour une **micro-signature xPortal** (caps 15 USD / trade, 40 USD / jour). Ce n’est pas un broadcast autonome et ce n’est pas un PEM. Paybox UI est **fail-closed** (`VITE_PAYBOX_ENABLED` défaut `false`). Le rail Render reste **preprod**.

**Le site est en ligne. Le trading autonome ne l’est pas.** Upbit (notice `207379109`, 23 oct 06:02 UTC) prolonge la surveillance EGLD jusqu’au **16–20 novembre 2026**. Bithumb a prolongé le warning EGLD (et FET) le même jour. La fenêtre FET (**2–6 nov**) ne lève pas EGLD. Aucune notice de levée EGLD n’est indexée au **30 oct 05:36 UTC**. Le statut wallet Upbit observé ce jour-là est **retraits ouverts, dépôts bloqués**, désignation toujours affichée. Reprise des retraits ≠ levée. Au probe : **jour 7/29**, **17 jours** avant le 16 nov, **22 jours** avant le 21 nov 00:00 UTC. Le client recalcule ces chiffres.

Probe API du **30 oct 05:36 UTC**. CodeHash agents inchangé (`igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`). Market et slot : hashes inchangés. LIA Ops nonce **1479** figé. Solde **1.585598 EGLD**.

|               |                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------- |
| **Live**      | https://neltud.github.io/xArtists/                                                       |
| **GO_LIVE**   | https://neltud.github.io/xArtists/#/go-live                                              |
| **Packs**     | https://neltud.github.io/xArtists/#/agents                                               |
| **Musée**     | https://neltud.github.io/xArtists/#/museum                                               |
| **Repo**      | https://github.com/Neltud/xArtists                                                       |
| **Posture**   | **Site public** — micro-signature **armée** — LIA Ops **gelé** — spin REAL **fermé** — Paybox UI **fermé** |
| **Indexer**   | healthy · epoch **2278** · refreshRate **600** · rounds **78085** / 144000               |
| **Supernova** | LIVE depuis le 10 sept 2026 (epoch 2233) · **+45 epochs**                                |
| **EGLD**      | **$3,21** · mcap **$99,73M** · circ 31,07M · staked 13,89M · APR **9,13 %**              |
| **LIA Ops**   | **1.585598 EGLD** · nonce **1479** (aucune TX depuis le 17 oct)                          |
| **Slot**      | **0,5000 EGLD** · hash inchangé · `isPayable=false` · REAL fermé                         |
| **Market**    | **0,0175 EGLD** · hash inchangé · payable · acheter seulement l’id actif (**#2**)        |
| **Agents SC** | **0,013 EGLD** · non payable par SC · packs **10 / 5 / 2,5**                             |
| **$TRO**      | `TRO-94c925` · circ **476 224** · **561** comptes · ~$0.00007902 · mcap **~$37,63** · 2815 tx |
| **Build**     | stamp Pages **0.125.0** · user-sign on · Paybox default off                              |

***

## Couches produit

| Layer            | Rôle                     | État 28 oct                                                                   |
| ---------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Studio / Gallery | NFT (NFTUDURI + musée)   | Lecture API + musée immersif                                                  |
| Marketplace      | List / Buy / Bid         | SC live · escrow `ASFT-a6273a-01` · id **#2** seulement · pas de prix inventé |
| Agents           | Pulse · Yield · Sentinel | SC live · 10 / 5 / 2,5 EGLD · fiat 110 / 75 / 50 € **non encaissable**        |
| LIA              | Copilote                 | Micro-signature xPortal armée. LIA Ops gelé (nonce 1479)                     |
| $TRO             | Utility                  | Illiquide (561 comptes). 2815 tx, pas une preuve visiteur                     |
| Slot             | Primordial               | House 0,5 · REAL fermé · compte non payable                                   |
| Treasury         | Split fees               | codeHash live · **destination null** · balance 0 · ne pas `claimFees`         |
| Carte entité     | Référence ops            | API live. Repli JSON = probe du 30 oct                                        |
| Checkout fiat    | Paybox / quote Rule 1    | HMAC/IPN en repo. UI fail-closed. Render **preprod**. PR Neon **non mergée**  |

***

## Veille technologique (30 oct 05:36 UTC)

### Corée — bloquant n°1, toujours une prolongation

* **Upbit**, 23 oct 06:02 UTC : « investment warning » MultiversX (EGLD/KRW, EGLD/BTC, EGLD/USDT) étendu jusqu’à la **3ᵉ semaine de novembre 2026 (16–20 nov)**. Notice : https://www.upbit.com/service_center/notice?id=207379109 — toujours la notice de référence. Aucune levée publiée depuis.
* **Bithumb**, 23 oct : warning EGLD **et FET** prolongé. Prochaine annonce EGLD : **16–20 nov**. FET : **2–6 nov**. Ce ne sont pas la même porte. EGLD n’est pas dans les delist déjà décidés (SOPH / ZIL).
* **Statut wallet Upbit au 30 oct** : EGLD en retraits seuls, dépôts bloqués, mention de désignation toujours visible. L’interruption du 21 oct 20:00 KST n’est plus l’état courant. Reprise des retraits ≠ levée du warning.
* Notice Upbit sur **INIT** : autre actif. Ne pas la lire comme un signal EGLD.
* EGLD **$3,21** (API `/economics`), sous les $3,37 du 28 oct. Mcap ~$99,73M. Le pair USDT Upbit a imprimé un écart de carnet mince. Contexte, pas un signal d’exécution.
* Conséquence produit : **aucun nouveau trade LIA Ops**. Une micro-signature **utilisateur** reste possible sous caps. Le site (galerie, musée, market en lecture, packs) est le go-live.

### MultiversX

* Supernova 600 ms stable. Epoch **2278** (2276 le 28 oct, 2275 le 27 oct, 2265 le 17 oct). Rien de protocole à shipper.
* API publique : `/stats`, `/economics`, `/accounts`, `/tokens/TRO-94c925` répondent. Hashes agents / market / slot / treasury **identiques** au 28 oct.
* Comptes : market payable, agents / slot / treasury **non** payables par smart contract. Slot rejette toujours l’EGLD.
* Front : `@multiversx/sdk-dapp` ^3, Vite 5, Node **20** sur le runner Pages. Ne pas merger les majors Dependabot (Vite 8, ESLint 10) sans QA.
* Stack Vellum (Hatom, orchestrateur multi-chain, relayer gasless, Apple/Google Pay) reste **hors chemin critique** tant que la revue KR n’est pas levée par une annonce de maintien.

### Wallet ops (à ne pas confondre avec le client)

Le 17 oct 12:57–13:02 UTC, `erd1p4zyy…qu0crn6` a signé wrap / addLiquidity ×2 / swap / multiPairSwap / xo. Nonce **1479** inchangé le 30 oct. Solde **1.585598 EGLD**. Ces TX n’autorisent pas un nouveau live.

### NFT / agents / fiat

* MX-8004 : LIA non inscrit. Après une annonce de maintien seulement.
* Paybox : module HMAC/IPN en repo. UI **fermée par défaut** depuis ce push (le défaut `true` du 29 oct était en avance sur la recette). Render = preprod, `paybox_configured` vrai, A-E2E (carte test + IPN + My Packs) toujours ouvert. `PAYBOX_ENV=prod` = NO-GO.
* Acheter un pack en EGLD dépense 10 / 5 / 2,5 vrais EGLD. Paper mint = DEV only.
* [PR #200](https://github.com/Neltud/xArtists/pull/200) (store commandes Neon) : **laissée ouverte, non mergée**. Lockfile `access-api` cassé. `npm ci` du workflow Pages casserait. Pas le prochain pas.

***

## Ce passage (0.125.0)

1. Le fallback réseau et les JSON publics ne servent plus le probe du 28 oct (epoch 2276, EGLD $3,37). Ils servent le probe du 30 oct.
2. Le listing #2 n’est toujours pas un prix vivant de 0,25 EGLD. Solde market **0,0175**.
3. `upbitPosture` reste `extended` jusqu’au 21 nov 00:00 UTC. La phrase ne prétend plus que les retraits sont suspendus, ni que le drapeau vaut 0.
4. Stamp Pages **0.125.0**. `VITE_PAYBOX_ENABLED` défaut **false**. `VITE_LIA_LIVE_TRADING` défaut **1** = user-sign seulement.
5. Ce push déclenche `static.yml` (code + JSON, pas les markdown seuls).

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

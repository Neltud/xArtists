# Analyse DApp complète xArtists — 8 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. `LIA_LIVE_TRADING=0`.

Les 9 contrats produit sont toujours **LIVE** (codeHash inchangés vs 1–7 oct). Deux vérités on-chain changent le produit aujourd’hui :

1. **Marketplace** — le Buy de la vitrine visait le **listing #1**, déjà vendu (`active=false`). Le NFT encore en escrow est le **listing #2**, actif, **0,25 EGLD**, avec un **bid 0,01** locké. C’est pour ça que le retry `buyNft` renvoyait `inactive`.
2. **Slot** — la house **0,5 EGLD** est bien là, mais le **compte n’est pas payable** (`isPayable=false`). Un spin EGLD est rejeté par le protocole avant le tirage. Le mode Fun reste le seul chemin public.

| | |
|---|---|
| **Live** | https://neltud.github.io/xArtists/ |
| **GO_LIVE** | https://neltud.github.io/xArtists/#/go-live |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_LIVE SC** — LIA **paper** — spin REAL **fermé** |
| **Indexer** | healthy · epoch **2256** · refreshRate **600** |
| **Supernova** | LIVE 10 sept 2026 · epoch 2233 · probe **J+28** |
| **EGLD** | **$4,09** · mcap ~$126,4M · staked 14,25M · APR ~8,89 % |
| **LIA Ops** | **1,6038 EGLD** · nonce **1473** |
| **Slot** | **0,5000 EGLD** · `isPayable=false` · min bet 0,001 |
| **Market** | **0,0175 EGLD** · payable · fees 0,0075 + bid 0,01 |

---

## Probe API — 8 oct 2026 ~04:35 UTC

`/stats` : epoch **2256**, roundsPassed **71857** / 144000 (~50 %), refreshRate **600**, accounts **9 268 296**, tx **630 929 367**, blocks **141 177 176**, shards **3**.

`/economics` : prix **4,09**, mcap **126 431 622**, circ **30 912 377**, staked **14 245 135**, APR **0,0889**.

TRO-94c925 : circ **476 224**, **563** comptes, **2808** tx, decimals 6, paused=false, prix ~**$0,000090**, mcap ~**$42,85**.

NFTUDURI-2990b6 : **152** NFTs, **41** holders, transférable.

LIA Ops `erd1p4zyy…0crn6` : **1,603782 EGLD**, nonce 1473, pas de code (wallet). Positions LP inchangées (TROWEGLD, TROUSDC, TROMEX, 10 000 TRO, dust ASH/MEX). Pas un flag live-trading.

### Smart contracts

| SC | EGLD | Payable | Note 8 oct |
|---|---|---|---|
| nft-marketplace `…q8txmm` | **0,0175** | **oui** | listing #2 actif |
| slot-casino `…qs4g34f` | **0,5000** | **non** | spin EGLD impossible |
| tro-staking `…qpe3xf3` | 0 | non | **3 TRO** (3 000 000 atomic) |
| venue, agents, nft-stake, gov, escrow, treasury | 0 | non | codeHash inchangés |

codeHash marché `8TTszCmN…sZBgFc=` · slot `UZ0nX6dW…6VJCs=`. **Ne jamais financer** les placeholders legacy empty.

### Marketplace — décodage `getListing`

| id | token | prix | active | bid |
|---|---|---|---|---|
| 1 | ASFT-a6273a nonce 1 | 0,25 EGLD | **non** | 0 |
| 2 | ASFT-a6273a nonce 1 | 0,25 EGLD | **oui** | **0,01 EGLD** |
| 3+ | storage vide | | | |

`getAccumulatedFees` = **0,0075 EGLD**. `getFeeBps` = **300**. `isPaused` = false. Royalty listing = **500 bps**. Le NFT `ASFT-a6273a-01` (BlackArtPass) est toujours sur le SC. Ce n’est pas un 1/1 NFTUDURI.

Le front (`marketplaceIndex`) prenait `listing_id = 1` dès qu’un seul NFT était en escrow, puis le masquait s’il voyait le buy réussi de l’id 1. Résultat : soit Buy mort (`inactive`), soit carte absente. **Correctif** : lire `getListing` et n’attacher que l’id **actif** (ici 2) avec le prix on-chain.

### Slot — cause réelle

Les erreurs historiques `wrong number of arguments` / `ESDT expected` collent à un compte **non payable** : la valeur EGLD n’entre pas. Le source a déjà `#[payable("EGLD")] spinEgld(client_seed)`. Le bit CodeMetadata n’a jamais été posé au deploy (`deploy-slot-casino.yml` n’envoyait pas `--metadata-payable`, et ce workflow **crée une nouvelle adresse**).

`getMinBet` = 0,001 EGLD. `getSpinCount` = 0.

**Ne pas** ouvrir le spin REAL. **Ne pas** redeploy (la house resterait sur l’ancienne adresse). Upgrade du même contrat : [`SLOT_PAYABLE_UPGRADE.md`](SLOT_PAYABLE_UPGRADE.md). Workflow manuel `upgrade-slot-payable.yml`, confirmation `UPGRADE_SLOT_PAYABLE`. Pas lancé depuis cette mise à jour.

---

## Ce qui a été poussé (8 oct)

- Résolution du listing actif avant Buy (plus de guess id 1).
- Page GO_LIVE : payable market/slot + listings décodés.
- Message slot honnête (`isPayable=false`). Fun inchangé.
- `ci-cd.yml` **retiré du push** : il faisait `rm -rf docs/*` puis déployait ce dossier vide sur gh-pages, en concurrence avec `static.yml`.
- Futurs deploys slot : flags `--metadata-payable --metadata-upgradeable --metadata-readable`.
- `data/contracts.json` + copie front : probe 8 oct.

Non touché : `LIA_LIVE_TRADING`, PEM, flags `VITE_*_CODEHASH_OK`, destinations treasury, Dependabot majors, upgrade slot effectif.

---

## Live vs paper

| Surface | État 8 oct |
|---|---|
| Pages | `static.yml` est le pipeline. Dernier build Pages vert (commit shadow 8 oct 00:05 UTC) ; ce push relance le front |
| Marketplace | SC payable · Buy doit viser **#2** · #1 inactif · ASFT escrowed · bid 0,01 à rembourser si cancel/buy |
| Packs agents | SC live · checkout pas un mint ouvert |
| Slot | house 0,5 · Fun ouvert · REAL fermé (compte non payable) |
| Staking TRO | LIVE · 3 TRO |
| NFT stake / gov / escrow / treasury / venue | code live, balance 0 |
| LIA | **paper** |
| Treasury dest | **null** (PR #87 toujours ouverte) |
| MX-8004 First 100 | pas inscrit |

---

## Suites logiques (ordre — 8 oct)

1. **Laisser `static.yml` vert** après ce push, hard-refresh la vitrine, vérifier que BlackArtPass porte l’id **2** avant tout Buy.
2. **Ne pas acheter l’id 1.** Un Buy #2 est un vrai paiement **0,25 EGLD** (+ le bid 0,01 est remboursé au bidder par le SC). Décision humaine, pas un script.
3. **Treasury dest (PR #87)** avant de claim les 0,0075 EGLD de fees. `claimFees` envoie à l’owner, pas au splitter.
4. **Slot** : upgrade metadata du contrat existant, puis micro-spin **0,001** EGLD. Seulement après `isPayable: true`. Jusque-là Fun.
5. **MX-8004 / First 100** : inscrire LIA. Ce n’est pas du yield.
6. **OOX SDK** (5 oct, v0.1) : buy/list/bid sur le carnet OOX depuis une dApp, tx non signées `@multiversx/sdk-core`. Piste liquidité NFT **après** que le listing maison #2 soit propre. Pas intégré dans ce push (pas de dépendance non vérifiée).
7. **Ne pas** `LIA_LIVE_TRADING=1`. LP manuel ≠ trading live. Fenêtre CEX interne 6–11 oct : observer, ne pas lever les caps. Upbit encore en revue (~19–23 oct).
8. **Ne pas merger** les PRs Dependabot majors (vite 8, eslint 10, vitest 4, actions checkout 6) pendant que Pages est le chemin live.
9. **Ne pas** committer `VITE_*_CODEHASH_OK=1`.

---

## Veille technologique — 8 oct 2026

### Réseau

- Supernova mainnet depuis le **10 sept 2026** (epoch 2233, rounds 600 ms, epoch ~24 h). Probe = **J+28**, epoch **2256**.
- 400 ms et ZK natif : **pas calendrés**.
- Indexer public `https://api.multiversx.com` : HTTP 200 sur stats, economics, accounts, tokens, collections, `/query`.
- Docs officielles (juillet 2026) : Staking V5 live depuis le 2 déc 2025 ; émission EGLD en tail inflation (plancher 2–5 %) après le vote Economic Evolution. Supernova : audit externe passé, chiffres Battle of Nodes (mars 2026) jusqu’à 120k TPS en test — la prod observée ici reste **600 ms**.

### Prix / liquidité

- EGLD **$4,09** (4,14 le 7 oct, 4,40 le 2 oct). Mcap ~**$126M**. Staked ~14,25M / circ ~30,91M.
- xExchange reste thin. Pas un signal pour allumer LIA.
- $TRO : prix API non nul mais **illiquide** (563 comptes, mcap ~$43).

### Marché NFT MultiversX

- **OOX SDK** annoncé le **5 oct 2026** (OOX.art / OnionXLabs). Scope v0.1 : buy, bulk buy, bid, list, change price, cancel, end auction. Même carnet que oox.art. Wallet-agnostic.
- XOXNO garde `@xoxno/sdk-js` (auth native 24 h). Déjà le réflexe historique du repo pour les liens externes.
- Préorders OOX (collection Octos) annoncées fin sept — hors périmètre xArtists.

### Tooling MVX (repos touchés cette semaine)

- `mx-api-service`, `mx-chain-proxy-go`, `mx-chain-go`, explorer : poussés autour du **7 oct**.
- `mx-sdk-dapp-form` 5.0.x (août–sept) : build Vite, composants UI partagés. Le front xArtists reste sur `@multiversx/sdk-dapp` ^3 et Vite 5. **Ne pas sauter Vite 8** via Dependabot maintenant.
- `mx-sdk-dapp-swap` a bougé le 6 oct. Pas branché ici.

### Agents

- MX-8004 côté xArtists = inscription soulbound LIA (First 100), **toujours pas faite**.
- Stack agentique MVX citée dans la doc interne (UCP, ACP/AP2, x402, MCP, Relayed v3) : veille, pas un chantier de ce push.

### Incident VM (rappel, pas un nouvel event)

- 19–25 sept 2026 : pause, exploit atomicité, hardfork recovery, pont ETH rouvert.
- 28 sept : pic TPS public. 30 sept–5 oct : dépôts CEX rouverts (Binance US, Kraken, Bitget).
- Fenêtre interne exchanges **6–11 oct** encore la consigne ops : ne pas lever les caps xArtists.

### Hygiène repo

- 14 « issues » ouvertes = **PRs**, pas des bugs tracker : #87 treasury dest, #60/#46 recaps, Dependabot #3–#8 et #28–#32.
- Dernier commit humain avant celui-ci : fix CommandWall `atmo.mesh` (7 oct). Ensuite ticks shadow `[skip ci]`.
- Pages : pipeline `static.yml` vert. L’ancien `ci-cd.yml` était un risque de **wipe** du site ; il ne part plus sur `push`.

---

## Sécurité

- Aucun PEM, JWT, webhook secret dans ce diff.
- Aucune TX signée, aucun upgrade SC exécuté.
- Buy #2 n’est pas déclenché automatiquement.
- Spin REAL reste un throw avant `send`.

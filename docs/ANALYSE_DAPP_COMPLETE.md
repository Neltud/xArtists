# Analyse DApp complète xArtists — 16 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. `LIA_LIVE_TRADING=0` reste forcé côté client.

Probe API du **16 oct ~04:35 UTC**. Huit contrats produit gardent le **même codeHash** qu’au 14 oct. **Un seul a bougé** : `agents-marketplace`, upgrade `buyPack`. Le front publié comparait encore l’ancien hash, avec `VITE_AGENTS_CODEHASH_OK` vide dans le bundle Pages — les packs restaient **fermés** alors que le SC est live et que `getPackPrice` répond 10 / 5 / 2.5 EGLD.

| | |
|---|---|
| **Live** | https://neltud.github.io/xArtists/ |
| **GO_LIVE** | https://neltud.github.io/xArtists/#/go-live |
| **Packs** | https://neltud.github.io/xArtists/#/agents |
| **Musée** | https://neltud.github.io/xArtists/#/museum |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_LIVE SC** — packs **déverrouillés par hash** — LIA **paper** — spin REAL **fermé** |
| **Indexer** | healthy · epoch **2264** · refreshRate **600** |
| **Supernova** | LIVE depuis le 10 sept 2026 · epoch 2233 · **31 epochs** plus tard |
| **EGLD** | **$3,71** API · mcap **$114,9M** · circ 30,97M · staked 14,27M · APR **8,87 %** |
| **LIA Ops** | **1,603782 EGLD** · nonce **1473** (inchangé vs 14 oct) |
| **Slot** | **0,5000 EGLD** · `isPayable=false` · min bet 0,001 · spin count 0 |
| **Market** | **0,0175 EGLD** · payable · fees 0,0075 + bid 0,01 |
| **Agents SC** | **0,013 EGLD** · `isPayable=false` sur le compte · endpoint `buyPack` déjà prouvé payable |

Ce push relance `static.yml` (fichiers TS + JSON, pas seulement du markdown).

---

## Probe — 16 oct 2026

`/stats` : epoch **2264**, roundsPassed **71805** / 144000, refreshRate **600**, accounts **9 272 324**, tx **632 550 690**, blocks **145 746 889**.

`/economics` : prix **3,71**, mcap **114 893 610**, circ **30 968 628**, staked **14 270 031**, APR **0,088742**.

TRO-94c925 : circ **476 224**, **562** comptes, **2810** tx, decimals 6, paused=false, prix API ~**$0,0000796**, mcap ~**$37,90**.

NFTUDURI-2990b6 : **152** NFTs, **41** holders.

LIA Ops `erd1p4zyy…0crn6` : **1,603782 EGLD**, nonce 1473, pas de code (wallet). Pas un flag live-trading.

### Smart contracts

| SC | EGLD | Payable | codeHash vs 14 oct |
|---|---|---|---|
| nft-marketplace `…q8txmm` | **0,0175** | **oui** | identique |
| agents-marketplace `…gdqwsg` | **0,013** | compte **non** (endpoint `buyPack` oui) | **changé** → `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=` |
| slot-casino `…qs4g34f` | **0,5000** | **non** | identique |
| tro-staking `…qpe3xf3` | 0 | non | identique · `getTotalStaked` = **3 TRO** |
| venue, nft-stake, gov, escrow, treasury | 0 | non | identiques |

`getFeeBps` = **300**. `getAccumulatedFees` = **0,0075 EGLD**. `getMinBet` slot = **0,001**. `getSpinCount` = **0** (retour vide).

`getPackPrice` : Pulse `0x01` **10 EGLD** · Yield `0x02` **5 EGLD** · Sentinel `0x03` **2,5 EGLD**.

Les 0,013 EGLD du SC agents = `buyPack` réussis à **0,001 × 3 + 0,01** (prix d’essai, avant `setPackPrice`). Derniers `setPackPrice` : nonce de tx `8ea9d491…` (owner `erd1kex0p…`). Ce n’est pas un chiffre d’affaires 10/5/2.5.

### Marketplace

| id | token | prix | active | bid |
|---|---|---|---|---|
| 1 | ASFT-a6273a nonce 1 | 0,25 EGLD | **non** | 0 |
| 2 | ASFT-a6273a nonce 1 | 0,25 EGLD | **oui** | **0,01 EGLD** |
| 3+ | storage vide (query 400 « input too short ») | | | |

---

## Bug corrigé dans ce push

Le bundle Pages `index-CQ2QocDX.js` (build `VITE_APP_BUILD=3.10.0`) contient :

- `VITE_AGENTS_CODEHASH_OK: ""` alors que marketplace / TRO staking / venue sont à `"1"`
- hash agents attendu : `tDIcnNMbDG5E7tpb7NTeJDnT6JxKs7faN7hyCALFUWs=` (bytecode **avant** `buyPack`)
- hash explorer réel : `igm9oUpgad+QO2cQqhphuLZuicEBNR7jdcQHk8YEe00=`

`canBuyAgent()` = flag env **ou** match runtime. Les deux étaient faux. Achat de pack impossible dans l’UI, SC pourtant live.

Correctifs :

1. `MAINNET_CODEHASH.agents_marketplace` aligné sur l’explorer.
2. `refreshRuntimeCodehashes` écrit `false` quand le hash ne matche plus (un `sessionStorage` v3 ne gardait un `true` périmé). Clé cache **v4**.
3. Slot : `cache.slot` seulement si hash **et** `isPayable === true`. Le house à 0,5 EGLD ne rouvre pas le spin REAL.
4. Routes que l’UI citait et que `*` renvoyait à l’accueil : `/rwa`, `/rwa_catalog`, `/history`, `/digital-twin`, `/agents/voyage`, alias `/entity` → `/entities`, `/sim` → `/simulation`. Le lien « docs » trésorerie pointe le fichier GitHub, plus une route fantôme.
5. Snapshot de repli (`FALLBACK_SNAPSHOT` + `live_network_snapshot.json` + `contracts.json`) sur le probe du 16 oct.

Pas fait, volontairement :

1. **Pas d’achat #2.** 0,25 EGLD réel.
2. **Pas de `claimFees`.** Treasury dest null.
3. **Pas d’upgrade slot.** Un nouveau deploy abandonnerait les 0,5 EGLD. PEM hors git, upgrade du **même** compte.
4. **Pas de `LIA_LIVE_TRADING=1`.** EGLD **$3,71**. Fenêtre Upbit **19–23 oct** pas encore tranchée.
5. **Pas de merge Dependabot majors** (Vite 8, ESLint 10, Vitest 4). Pages reste sur Vite 5.
6. **Pas d’OOX.** Listing maison #2 reste le seul Buy de la vitrine.
7. **Pas d’inscription MX-8004.**
8. **Pas de TX signée, pas de PEM.**

---

## Ce qui est live vs ce qui ne l’est pas

| Surface | État 16 oct |
|---|---|
| Pages | ce push reconstruit Vite (`static.yml`) |
| Packs agents | SC live · prix 10/5/2.5 · UI déverrouillée par hash · achat = vrai EGLD |
| Marketplace | SC payable · Buy = id **actif** seulement · #2 à 0,25 · bid 0,01 |
| Musée | salle Three.js v0.110 (lumières) · pas de spend |
| LIA Hub | trading **paper** · intent xPortal = preuve API |
| Slot | house 0,5 · REAL fermé (`isPayable=false`) · route `/slot` → accueil |
| Staking TRO | LIVE · 3 TRO |
| NFT stake / gov / escrow / treasury / venue | code live, balance 0 |
| Treasury dest | **null** |
| RWA catalog | page branchée sur `/rwa` (était un lien mort) |
| MX-8004 First 100 | pas inscrit |
| OOX SDK | pas de paquet npm épinglé |

---

## Veille technologique — 16 oct 2026

### Réseau

- Supernova mainnet depuis le **10 sept 2026** (epoch 2233, rounds **600 ms**, 144 000 rounds/epoch). Pas de passage à 400 ms. Doc builders : config **v2.0.9.0**, binaire **v2.0.9** (14 sept). `mx-sdk-rs`, `mx-api-service`, `mx-chain-proxy-go` ont encore bougé le **15 oct**.
- Indexer `https://api.multiversx.com` : HTTP 200 sur stats / economics / accounts / tokens / collections. `/query` HTTP 201 sur `getListing` (args hex `01`/`02`), `getBid`, `getFeeBps`, `getPackPrice`, `getMinBet`, `getSpinCount`, `getTotalStaked`.
- Le **15 oct**, une foule devnet (`mvxPulse`) a publié un pic ~**238 k ƒTPS** sur **devnet**, pas sur le mainnet. Ce n’est pas un changement de protocole à shipper dans la dApp.
- Le front reste sur `@multiversx/sdk-dapp` ^3 et **Vite 5**. `static.yml` est encore en **Node 20** (déprécié ; les runners savent forcer Node 24). Pas le bloqueur de ce build.

### Prix et places de marché

- API economics **$3,71**, mcap **$114,9M**. −1,3 % vs le probe du 14 oct ($3,76), toujours loin des ~$4,60 du 5 oct. Pas un signal pour allumer LIA.
- **Upbit** (revue au 15 oct, Koin Bülteni) : EGLD est sur la liste **investissement sous surveillance** depuis le **21 sept** (~3 semaines, environ −3 %), **pas** sur la liste de delist décidée. Delist annoncés : ICX (dernier jour **19 oct**) et SOPH (**16 nov**). La fenêtre de décision EGLD **19–23 oct 2026** est ouverte dans trois jours. Dépôts/retraits étaient toujours décrits comme haltés au 12 oct (retraits d’abord, dépôts ensuite, si reprise).
- **Crypto.com** : dépôts et retraits EGLD réouverts, annoncé le **12 oct**. Rien de nouveau le 16.
- $TRO : illiquide (562 comptes, mcap ~38 $).

### NFT et agents

- **OOX SDK** (5 oct, v0.1) : toujours pas branché. La liquidité secondaire n’est pas un second carnet maison.
- XOXNO reste le lien externe historique.
- MX-8004 : LIA **n’est pas** sur agents.multiversx.com. First 100 (1 EGLD, ≥ 5 jobs, trust > 90) pas commencé.

### Hygiène

- Cause du pack fermé : hash de config figé au 1er oct, upgrade `buyPack` ensuite, secret Pages agents laissé vide. Les trois autres flags (`MARKETPLACE`, `TRO_STAKING`, `VENUE`) sont à `1` dans le bundle — incohérence, pas une politique.
- Aucun PEM, JWT ou secret. Aucune TX signée par cet update.

---

## Sécurité

- Acheter un pack après ce déploiement **dépense de vrais EGLD** (10 / 5 / 2.5) et mint 1 NFT vers le wallet connecté. Ce n’est pas un paper mint (paper mint reste DEV-only).
- Buy #2 n’est pas envoyé par ce déploiement.
- Spin REAL reste fermé tant que le compte slot n’est pas payable — y compris si un vieil onglet avait mis `slot=true` en cache (clé v4 + test `isPayable`).
- Un TxHash du journal LIA n’est « exécuté » que si l’API le voit en succès et que `sender` = wallet connecté.
- Les placeholders legacy vides ne doivent recevoir aucun fonds.
- Ne pas `claimFees` tant que la destination trésorerie est null.

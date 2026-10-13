# Analyse DApp complète xArtists — 13 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. `LIA_LIVE_TRADING=0` est **forcé** dans le build client.

Probe API du **13 oct ~04:35 UTC**. Les 9 contrats produit sont toujours **LIVE**. Les codeHash sont **identiques** au 11 oct (et au 8 oct). Rien n’a bougé côté fonds, listings ou payable.

| | |
|---|---|
| **Live** | https://neltud.github.io/xArtists/ |
| **GO_LIVE** | https://neltud.github.io/xArtists/#/go-live |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_LIVE SC** — LIA **paper** — spin REAL **fermé** |
| **Indexer** | healthy · epoch **2261** · refreshRate **600** |
| **Supernova** | LIVE depuis le 10 sept 2026 · epoch 2233 · **28 epochs** plus tard |
| **EGLD** | **$3,77** API · mcap **$116,7M** · circ 30,95M · staked 14,26M · APR **8,87 %** |
| **LIA Ops** | **1,603782 EGLD** · nonce **1473** (inchangé vs 11 oct) |
| **Slot** | **0,5000 EGLD** · `isPayable=false` · min bet 0,001 · spin count 0 |
| **Market** | **0,0175 EGLD** · payable · fees 0,0075 + bid 0,01 |

`static.yml` était **vert** le 12 oct 19:56 UTC (Command Center + IntentXPortalPanel). Les commits news/shadow portent `[skip ci]` et ne reconstruisent pas Vite. Ce push relance Pages.

---

## Probe — 13 oct 2026

`/stats` : epoch **2261**, roundsPassed **71969** / 144000, refreshRate **600**, accounts **9 270 309**, tx **631 924 166**, blocks **144 025 632**.

`/economics` : prix **3,77**, mcap **116 671 887**, circ **30 947 450**, staked **14 261 112**, APR **0,088704**.

TRO-94c925 : circ **476 224**, **562** comptes (−1 vs 11 oct), **2810** tx, decimals 6, paused=false, prix API ~**$0,0000842**, mcap ~**$40,09**.

NFTUDURI-2990b6 : **152** NFTs, **41** holders. Escrow market : un seul SFT, `ASFT-a6273a-01` (BlackArtPass).

LIA Ops `erd1p4zyy…0crn6` : **1,603782 EGLD**, nonce 1473, pas de code (wallet). Pas un flag live-trading.

### Smart contracts

| SC | EGLD | Payable | codeHash vs 11 oct |
|---|---|---|---|
| nft-marketplace `…q8txmm` | **0,0175** | **oui** | identique |
| slot-casino `…qs4g34f` | **0,5000** | **non** | identique |
| tro-staking `…qpe3xf3` | 0 | non | identique · **3 TRO** |
| venue, agents, nft-stake, gov, escrow, treasury | 0 | non | identiques |

`getFeeBps` = **300**. `getAccumulatedFees` = **0,0075 EGLD**. `getMinBet` slot = **0,001**. `getSpinCount` vide (= 0).

### Marketplace

| id | token | prix | active | bid |
|---|---|---|---|---|
| 1 | ASFT-a6273a nonce 1 | 0,25 EGLD | **non** | 0 |
| 2 | ASFT-a6273a nonce 1 | 0,25 EGLD | **oui** | **0,01 EGLD** |
| 3+ | storage vide (query 400) | | | |

---

## Ce qui est live vs ce qui ne l’est pas

| Surface | État 13 oct |
|---|---|
| Pages | dernier build Vite **12 oct 19:56** vert. Ce push republie |
| Marketplace | SC payable · Buy = id **actif** seulement · #2 à 0,25 · bid 0,01 |
| Packs agents | SC live · OnRamp EUR (MoonPay) · pas un mint ouvert |
| LIA Hub | trading **paper** · intent xPortal **non custodial** |
| Slot | house 0,5 · Fun ouvert · REAL fermé (`isPayable=false`) |
| Staking TRO | LIVE · 3 TRO |
| NFT stake / gov / escrow / treasury / venue | code live, balance 0 |
| Treasury dest | **null** — ne pas claim les 0,0075 |
| MX-8004 First 100 | pas inscrit · explorer agents.multiversx.com existe |
| OOX SDK (5 oct, v0.1) | pas de paquet npm épinglé. Bacon Wallet liste déjà sur OOX (8 oct) |
| Entity map | le JSON **publié** mentait encore (28 août : LIA **0,069 EGLD**, refreshRate **6000**). Corrigé dans ce push |

---

## Suites — ce push, et ce qui reste humain

Fait dans ce push, sans PEM et sans transaction :

1. **Bug intent.** « Exécuter via xPortal » ne construisait aucune TX et `Lier` marquait exécuté dès qu’une chaîne faisait ≥ 16 caractères. Le bouton s’appelle maintenant **Suivi signature**. Un hash n’est accepté que s’il fait 64 hex, que l’API le voit en `success`, et que `sender` = wallet connecté.
2. Snapshot de repli (`networkProbe` + `public/data/live_network_snapshot.json` + `data/`) aligné sur le probe du 13 oct. La carte entité n’affiche plus une mcap en « milliards » pour ~117 M$ (`$116.7M`).
3. `contracts.json` expose les alias que `ScStatusBanner` lit (`contracts.marketplace`, `verification.code_empty=false`). Avant ça, la bannière disait « adresse absente » / « non déployé » alors que les SC sont LIVE.
4. Recap README + ce document.

Pas fait, volontairement :

1. **Pas d’achat #2.** 0,25 EGLD réel.
2. **Pas de `claimFees`.** Treasury dest null ; `claimFees` paie l’owner, pas le splitter.
3. **Pas d’upgrade slot.** `upgrade-slot-payable.yml` exige un PEM hors git. Un nouveau deploy abandonnerait les 0,5 EGLD.
4. **Pas de `LIA_LIVE_TRADING=1`.** EGLD est passé de **$4,03** (close 11 oct, OKX) à **$3,77** API / ~**$3,66–3,81** spots le 13. −19 % sur 7 jours (depuis ~$4,60 le 5 oct). Upbit : retraits gelés, décision **19–23 oct** sur les trois paires. Observer. Ne pas lever les caps.
5. **Pas de merge Dependabot majors** (Vite 8). Pages reste sur Vite 5.
6. **Pas d’OOX.** Le listing maison #2 reste le seul Buy de la vitrine. SDK v0.1 = transactions non signées, liquidité partagée avec oox.art — à brancher plus tard, paquet vérifié.
7. **Pas d’inscription MX-8004.** Ce n’est pas du yield. Identity / Validation / Reputation sont le standard ; LIA n’a pas de soulbound ni 5 jobs vérifiés.

---

## Veille technologique — 13 oct 2026

### Réseau

- Supernova mainnet depuis le **10 sept 2026** (epoch 2233, rounds **600 ms**). Pas de passage à 400 ms ni de ZK natif calendré dans les sources revues au 13 oct.
- Indexer public `https://api.multiversx.com` : HTTP 200 sur stats, economics, accounts, tokens, collections. `/query` OK (HTTP 201) sur `getListing` / `getBid` / `getFeeBps`. Listing 3+ = 400 « input too short », traité comme fin de carnet.
- Le front reste sur `@multiversx/sdk-dapp` ^3 et **Vite 5**.

### Prix

- API economics **$3,77**, mcap **$116,7M**.
- Spots du 13 oct : OKX séance ~**$3,75–3,89** (open 3,808), Coinotag ~**$3,74** (−6 % 24 h au 12 oct 23:02 UTC), autre agrégat ~**$3,66**. Volume mince.
- 7 jours : glissade depuis ~$4,60 le 5–6 oct. xExchange reste thin. Pas un signal pour allumer LIA.
- **Upbit** (plus gros carnet EGLD) : dépôts/retraits haltés, label caution, décision entre le **19 et le 23 oct 2026** ([Cryptoticker, MAJ 12 oct](https://cryptoticker.io/en/egld-withdrawals-frozen-exchanges)). Kraken a rouvert l’EUR le 1er oct.
- $TRO : prix API non nul, **illiquide** (562 comptes, mcap ~40 $).

### NFT

- **OOX SDK** annoncé le **5 oct 2026** (OOX.art / OnionXLabs). v0.1 : buy, bulk buy, bid, list, change price, cancel, end auction. `Transaction` non signées `@multiversx/sdk-core`. Même carnet que oox.art.
- **8 oct** : Bacon Wallet live, multi-list / multi-send / multi-burn vers OOX. La liquidité secondaire du mois est là, pas dans un second carnet maison.
- Défi OOX octobre ($Victor) : hors scope xArtists.
- XOXNO reste le lien externe historique du repo. Pas de dépendance ajoutée.

### Agents

- MX-8004 (miroir ERC-8004) : Identity soulbound + Validation + Reputation, même shard. L’explorer public est [agents.multiversx.com](https://agents.multiversx.com). LIA **n’y est pas**.
- First 100 (1 EGLD) exige registration + ≥ 5 jobs vérifiés + trust > 90. Toujours pas commencé. Ce n’est pas un produit de yield.
- Le panneau intent du 12 oct promettait une signature xPortal qu’il ne lançait pas. Corrigé : preuve API, ou rien.

### Hygiène

- Les issues ouvertes historiques sont surtout des **PRs** (treasury #87 base ancienne, Dependabot majors). Ne pas merger #87 : la base n’est plus `main`.
- Aucun PEM, JWT ou secret dans ce diff. Aucune TX signée.

---

## Sécurité

- Buy #2 n’est pas envoyé par ce déploiement.
- Spin REAL reste fermé tant que le compte slot n’est pas payable.
- Un TxHash du journal LIA ne peut plus être forgé en local : succès on-chain + expéditeur = wallet connecté.
- Les placeholders legacy vides ne doivent recevoir aucun fonds.

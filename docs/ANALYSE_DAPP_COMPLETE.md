# Analyse DApp complète xArtists — 11 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. `LIA_LIVE_TRADING=0`.

Probe API du **11 oct ~04:40 UTC**. Les 9 contrats produit sont toujours **LIVE**. Les codeHash sont **identiques** au 8 oct. Rien n’a bougé côté fonds, listings ou payable.

| | |
|---|---|
| **Live** | https://neltud.github.io/xArtists/ |
| **GO_LIVE** | https://neltud.github.io/xArtists/#/go-live |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_LIVE SC** — LIA **paper** — spin REAL **fermé** |
| **Indexer** | healthy · epoch **2259** · refreshRate **600** |
| **Supernova** | LIVE depuis le 10 sept 2026 · epoch 2233 · **26 epochs** plus tard |
| **EGLD** | **$3,91** · mcap ~$120,9M · circ 30,93M · staked 14,26M · APR ~8,87 % |
| **LIA Ops** | **1,603782 EGLD** · nonce **1473** (inchangé vs 8 oct) |
| **Slot** | **0,5000 EGLD** · `isPayable=false` · min bet 0,001 · spin count 0 |
| **Market** | **0,0175 EGLD** · payable · fees 0,0075 + bid 0,01 |

Le pipeline `static.yml` est **rouge depuis le 10 oct 13:04 UTC** (commit Lia Hub). `LiaPage.tsx` importait `../lib/protocolProfile`, `../lib/egldPrice`, `../lib/shadowExport`, `../lia/matrix` et `../lia/vellumStatus` — ces fichiers n’existent pas. Les vrais modules sont sous `src/lia/`. Les commits news/shadow portent `[skip ci]`, donc ils ne relancent pas Vite. Le site en ligne est resté sur le dernier build **vert** (10 oct 12:48 UTC, labels CommandCenter), **sans** OnRamp ni LiaAgentControl. Ce push répare les imports : le build local passe, `static.yml` peut republier.

---

## Probe — 11 oct 2026

`/stats` : epoch **2259**, roundsPassed **71834** / 144000, refreshRate **600**, accounts **9 269 202**, tx **631 473 300**, blocks **142 881 345**.

`/economics` : prix **3,91**, mcap **120 949 500**, circ **30 933 376**, staked **14 256 665**, APR **0,088716**.

TRO-94c925 : circ **476 224**, **563** comptes, **2808** tx, decimals 6, paused=false, prix API ~**$0,0000882**, mcap ~**$42,01**.

NFTUDURI-2990b6 : **152** NFTs, **41** holders, transférable.

LIA Ops `erd1p4zyy…0crn6` : **1,603782 EGLD**, nonce 1473, pas de code (wallet). Pas un flag live-trading.

### Smart contracts

| SC | EGLD | Payable | codeHash vs 8 oct |
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

Un seul NFT est en escrow : `ASFT-a6273a-01` (BlackArtPass). Ce n’est pas un 1/1 NFTUDURI.

**Bug encore présent au 10 oct :** si `getListing` ne matchait pas, `marketplaceIndex` **inventait l’id 1** dès qu’un seul NFT était en escrow. Le fichier statique `marketplace_listings.json` disait aussi `listing_id: 1, active: true`. Un Buy dans ce repli tape la ligne **déjà vendue** (`inactive`).

**Correctif 11 oct :**

- Buy uniquement si `getListing` renvoie `active=true` (ici l’id **2**).
- Plus de repli « tx order = listing id ».
- Seed JSON : id **2** actif, id **1** marqué vendu.
- `getBid` décodé : la carte et la page GO_LIVE montrent le **0,01 EGLD** locké. Un Buy #2 rembourse ce bid au bidder. Ce n’est pas un script d’achat.

---

## Ce qui est live vs ce qui ne l’est pas

| Surface | État 11 oct |
|---|---|
| Pages | `static.yml` cassé depuis le 10 oct 13:04 (imports LIA). Réparé dans ce push. L’artifact public était figé au build 12:48 UTC |
| Marketplace | SC payable · Buy = id **actif** seulement · #2 à 0,25 · bid 0,01 |
| Packs agents | SC live · OnRamp EUR (MoonPay) branché le 10 oct · pas un mint ouvert |
| LIA Hub | `LiaAgentControl` sur la page LIA (10 oct) · trading **paper** |
| Slot | house 0,5 · Fun ouvert · REAL fermé (`isPayable=false`) |
| Staking TRO | LIVE · 3 TRO |
| NFT stake / gov / escrow / treasury / venue | code live, balance 0 |
| Treasury dest | **null** — PR #87 ouverte, base obsolète. Ne pas claim les 0,0075 |
| MX-8004 First 100 | pas inscrit |
| OOX SDK (5 oct, v0.1) | pas de paquet npm épinglé ici. Pas intégré |

Release GitHub **0.98.0** le 10 oct (OnRamp, LiaAgentControl, validation photo HD, HoloDataRoom). Les commits suivants sont des ticks shadow / news `[skip ci]`.

---

## Suites — ce push, et ce qui reste humain

Fait dans ce push, sans PEM et sans transaction :

1. Couper le guess d’id de listing.
2. Afficher le bid locké.
3. Aligner le snapshot de repli réseau (il mentait : LIA à 2,09 EGLD / epoch 2249, et le test attendait encore 2242).
4. Recap + `contracts.json` au probe du 11 oct.
5. **Débloquer Pages** : imports LIA Hub pointent vers `src/lia/*`. `npm run build` dans `apps/frontend` passe.

Pas fait, volontairement :

1. **Pas d’achat #2.** 0,25 EGLD réel. Décision humaine.
2. **Pas de `claimFees`.** La destination treasury est null ; `claimFees` paie l’owner, pas le splitter.
3. **Pas d’upgrade slot.** Le workflow `upgrade-slot-payable.yml` exige une confirmation et un PEM hors git. Tant que `isPayable` est false, le spin REAL reste un refus avant `send`. Redeployer créerait une **nouvelle** adresse et laisserait les 0,5 EGLD derrière.
4. **Pas de `LIA_LIVE_TRADING=1`.** La fenêtre CEX interne 6–11 oct se termine aujourd’hui ; EGLD est passé de 4,09 $ (8 oct) à 3,91 $. Upbit encore cité en revue vers le 19–23 oct. Observer. Ne pas lever les caps.
5. **Pas de merge Dependabot majors** (vite 8, eslint 10, vitest 4, actions checkout 6). Pages reste sur Vite 5 / actions v4.
6. **Pas de `VITE_*_CODEHASH_OK=1` commité.**
7. **OOX** : liquidité secondaire possible plus tard, via le SDK officiel une fois le paquet vérifié. Le listing maison #2 doit rester le seul Buy de la vitrine.

---

## Veille technologique — 11 oct 2026

### Réseau

- Supernova mainnet depuis le **10 sept 2026** (epoch 2233, rounds 600 ms). Pas de passage à 400 ms ni de ZK natif calendré dans les sources revues.
- Indexer public `https://api.multiversx.com` : HTTP 200 sur stats, economics, accounts, tokens, collections. `/query` OK sur `getListing` / `getBid` / `getAccumulatedFees`. Listing 3+ renvoie 400 « function / storage », traité comme fin de carnet.
- Repos `mx-chain-*` / indexer : activité autour du **7–10 oct** (executor VM, indexer). `mx-sdk-dapp-swap` a bougé le 6 oct. Pas branché ici.
- Le front reste sur `@multiversx/sdk-dapp` ^3 et **Vite 5**. Ne pas prendre la PR Vite 8.

### Prix

- EGLD **$3,91** sur l’API economics (spot agrégé autour de **3,96 $** à 01:00 UTC selon COINOTAG, range 24 h ~3,95–4,06). Mcap API ~**121 M$**.
- 7 jours : glissade depuis ~4,59 $ le 5 oct. xExchange reste thin. Pas un signal pour allumer LIA.
- $TRO : prix API non nul, **illiquide** (563 comptes, mcap ~42 $).

### NFT

- **OOX SDK** annoncé le **5 oct 2026** (OOX.art / OnionXLabs). v0.1 : buy, bulk buy, bid, list, change price, cancel, end auction. Transactions **non signées** `@multiversx/sdk-core`. Même carnet que oox.art.
- Pas de dépendance ajoutée dans ce push : pas de nom de paquet vérifié dans le lockfile.
- XOXNO (`@xoxno/sdk-js`) reste le lien externe historique du repo.

### Agents

- MX-8004 / First 100 : inscription soulbound LIA, **toujours pas faite**. Ce n’est pas du yield.
- OnRamp EUR (MoonPay) et le dashboard multi-IA sont du chrome du 10 oct. Ils ne signent pas à la place de l’utilisateur et n’ouvrent pas le trading live.

### Hygiène

- Les « 14 issues » ouvertes sont des **PRs** : #87 treasury (base ancienne), recaps #60 / #46, Dependabot #3–#8 et #28–#32, Railway #3.
- Ne pas merger #87 en l’état : la base n’est plus `main`.
- Aucun PEM, JWT ou secret dans ce diff. Aucune TX signée.

---

## Sécurité

- Buy #2 n’est pas envoyé par ce déploiement.
- Spin REAL reste fermé tant que le compte slot n’est pas payable.
- Les placeholders legacy vides ne doivent recevoir aucun fonds.

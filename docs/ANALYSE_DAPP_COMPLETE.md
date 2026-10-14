# Analyse DApp complète xArtists — 14 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. `LIA_LIVE_TRADING=0` est **forcé** dans le build client.

Probe API du **14 oct ~04:35 UTC**. Les 9 contrats produit sont toujours **LIVE**. Les codeHash sont **identiques** au 13 oct. Rien n’a bougé côté fonds, listings ou payable. Seuls le prix EGLD, l’epoch et les compteurs réseau ont bougé.

| | |
|---|---|
| **Live** | https://neltud.github.io/xArtists/ |
| **GO_LIVE** | https://neltud.github.io/xArtists/#/go-live |
| **Musée** | https://neltud.github.io/xArtists/#/museum |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_LIVE SC** — LIA **paper** — spin REAL **fermé** — salle 3D **WebGL restaurée** |
| **Indexer** | healthy · epoch **2262** · refreshRate **600** |
| **Supernova** | LIVE depuis le 10 sept 2026 · epoch 2233 · **29 epochs** plus tard |
| **EGLD** | **$3,76** API · mcap **$116,4M** · circ 30,95M · staked 14,27M · APR **8,87 %** |
| **LIA Ops** | **1,603782 EGLD** · nonce **1473** (inchangé vs 13 oct) |
| **Slot** | **0,5000 EGLD** · `isPayable=false` · min bet 0,001 · spin count 0 |
| **Market** | **0,0175 EGLD** · payable · fees 0,0075 + bid 0,01 |

Le dernier Pages vert avant ce push est le commit musée du **13 oct 17:58 UTC** (repli CSS). Les ticks news/shadow portent `[skip ci]` et ne reconstruisent pas Vite. **Ce push relance `static.yml`.**

---

## Probe — 14 oct 2026

`/stats` : epoch **2262**, roundsPassed **71793** / 144000, refreshRate **600**, accounts **9 270 672**, tx **632 150 911**, blocks **144 598 421**.

`/economics` : prix **3,76**, mcap **116 388 882**, circ **30 954 490**, staked **14 266 945**, APR **0,088683**.

TRO-94c925 : circ **476 224**, **562** comptes, **2810** tx, decimals 6, paused=false, prix API ~**$0,0000819**, mcap ~**$39,02**.

NFTUDURI-2990b6 : **152** NFTs, **41** holders.

LIA Ops `erd1p4zyy…0crn6` : **1,603782 EGLD**, nonce 1473, pas de code (wallet). Pas un flag live-trading.

### Smart contracts

| SC | EGLD | Payable | codeHash vs 13 oct |
|---|---|---|---|
| nft-marketplace `…q8txmm` | **0,0175** | **oui** | identique |
| slot-casino `…qs4g34f` | **0,5000** | **non** | identique |
| tro-staking `…qpe3xf3` | 0 | non | identique · **3 TRO** (dernier probe storage) |
| venue, agents, nft-stake, gov, escrow, treasury | 0 | non | identiques |

`getFeeBps` = **300**. `getAccumulatedFees` = **0,0075 EGLD**. `getMinBet` slot = **0,001**. `getSpinCount` = **0**.

### Marketplace

| id | token | prix | active | bid |
|---|---|---|---|---|
| 1 | ASFT-a6273a nonce 1 | 0,25 EGLD | **non** | 0 |
| 2 | ASFT-a6273a nonce 1 | 0,25 EGLD | **oui** | **0,01 EGLD** |
| 3+ | storage vide (query 400) | | | |

---

## Ce qui est live vs ce qui ne l’est pas

| Surface | État 14 oct |
|---|---|
| Pages | dernier Vite vert **13 oct 17:58** = repli CSS. Ce push republie le WebGL |
| Musée | salle Three.js restaurée · sortie d’immersion · focus caméra sans rebuild |
| Marketplace | SC payable · Buy = id **actif** seulement · #2 à 0,25 · bid 0,01 |
| Packs agents | SC live · OnRamp EUR (MoonPay) · pas un mint ouvert |
| LIA Hub | trading **paper** · intent xPortal = preuve API, pas un hash collé |
| Slot | house 0,5 · Fun ouvert · REAL fermé (`isPayable=false`) |
| Staking TRO | LIVE · 3 TRO |
| NFT stake / gov / escrow / treasury / venue | code live, balance 0 |
| Treasury dest | **null** — ne pas claim les 0,0075 |
| MX-8004 First 100 | pas inscrit |
| OOX SDK | pas de paquet npm épinglé |

---

## Suites — ce push, et ce qui reste humain

Fait dans ce push, sans PEM et sans transaction :

1. **Musée.** Le corps WebGL (~20 Ko, commit `528eeb7`) avait été remplacé le 13 oct par un placeholder puis par le repli CSS (`MuseumGameHall`). La salle Three.js est de retour : joystick, dock RWA, i18n HUD. Inspecter une œuvre **ne reconstruit plus** la scène (`inspect` sorti des deps, lu via ref). Bouton **Fermer immersion** rend le menu musée à nouveau cliquable.
2. Snapshot de repli (`networkProbe` + `public/data/live_network_snapshot.json` + `data/`) aligné sur le probe du 14 oct. Epoch **2262**, EGLD **$3,76**, mcap **$116,4M**.
3. `contracts.json` : date de probe et note chaîne, codeHash inchangés.

Pas fait, volontairement :

1. **Pas d’achat #2.** 0,25 EGLD réel.
2. **Pas de `claimFees`.** Treasury dest null.
3. **Pas d’upgrade slot.** Un nouveau deploy abandonnerait les 0,5 EGLD. Il faut un PEM hors git et un upgrade du **même** compte.
4. **Pas de `LIA_LIVE_TRADING=1`.** EGLD ~**$3,76** API, séance OKX 14 oct ~**$3,76–3,84**. −18 % depuis ~$4,60 le 5 oct. Upbit : décision **19–23 oct** encore ouverte. Observer.
5. **Pas de merge Dependabot majors** (Vite 8). Pages reste sur Vite 5.
6. **Pas d’OOX.** Listing maison #2 reste le seul Buy de la vitrine.
7. **Pas d’inscription MX-8004.** Identity / Validation / Reputation. Pas un produit de yield.

---

## Veille technologique — 14 oct 2026

### Réseau

- Supernova mainnet depuis le **10 sept 2026** (epoch 2233, rounds **600 ms**). Pas de passage à 400 ms ni de ZK natif dans les sources revues au 14 oct.
- Indexer `https://api.multiversx.com` : HTTP 200 stats / economics / accounts / tokens / collections. `/query` HTTP 201 sur `getListing`, `getBid`, `getFeeBps`, `getMinBet`, `getSpinCount`. Listing 3+ = 400 « input too short ».
- Le front reste sur `@multiversx/sdk-dapp` ^3 et **Vite 5**. Node 20 des Actions est déprécié (runners déjà forcés en Node 24) — pas un bloqueur de ce build.

### Prix

- API economics **$3,76**, mcap **$116,4M**.
- OKX 14 oct (table historique, publiée le 14) : open **$3,811**, high **$3,844**, low **$3,761**, close affiché **$3,773**, volume **~$11,6k** — carnet mince, séance pas forcément close.
- 13 oct OKX : open 3,808 / close 3,786 / low **3,590**.
- 7 jours : glissade depuis ~$4,60 le 5–6 oct. Pas un signal pour allumer LIA.
- **Upbit** : dépôts/retraits haltés, label caution, décision entre le **19 et le 23 oct 2026**. Toujours la date annoncée le 12 oct — rien de nouveau le 14 avant l’ouverture de la fenêtre.
- **Crypto.com** : dépôts et retraits EGLD réouverts, annoncé par MultiversX le **12 oct**.
- $TRO : illiquide (562 comptes, mcap ~39 $).

### NFT

- **OOX SDK** (5 oct, v0.1) : transactions non signées, même carnet que oox.art. Pas branché.
- Bacon Wallet (8 oct) liste déjà vers OOX. La liquidité secondaire n’est pas dans un second carnet maison.
- XOXNO reste le lien externe historique. Pas de dépendance ajoutée.

### Agents

- MX-8004 : LIA **n’est pas** sur [agents.multiversx.com](https://agents.multiversx.com). First 100 (1 EGLD, ≥ 5 jobs, trust > 90) pas commencé.

### Hygiène

- Le build Pages du 13 oct 17:41 a cassé sur `getPack` non exporté. Corrigé le même jour (`ff7acd0`), puis le fichier WebGL a été écrasé par un placeholder de 37 octets (`1a69a1e`). Le repli CSS a été le dernier artefact vert. Ce push remet le corps de `528eeb7` et garde l’export `getPack`.
- Aucun PEM, JWT ou secret. Aucune TX signée.

---

## Sécurité

- Buy #2 n’est pas envoyé par ce déploiement.
- Spin REAL reste fermé tant que le compte slot n’est pas payable.
- Un TxHash du journal LIA n’est « exécuté » que si l’API le voit en succès et que `sender` = wallet connecté.
- Les placeholders legacy vides ne doivent recevoir aucun fonds.
- Fermer l’immersion ne signe rien : ça démonte seulement le canvas.

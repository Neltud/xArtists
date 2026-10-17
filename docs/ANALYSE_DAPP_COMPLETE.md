# Analyse DApp complète xArtists — 17 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**, pas un fonds. Tips ≠ investissement. Wallet utilisateur ≠ LIA Ops. `LIA_LIVE_TRADING=0` reste forcé côté client.

Probe API du **17 oct ~04:40 UTC**. Tous les codeHash produit matchent la config front (agents = upgrade `buyPack` du 16 oct). Packs déverrouillables via runtime explorer. Slot REAL fermé (`isPayable=false`).

| | |
|---|---|
| **Live** | https://neltud.github.io/xArtists/ |
| **GO_LIVE** | https://neltud.github.io/xArtists/#/go-live |
| **Packs** | https://neltud.github.io/xArtists/#/agents |
| **Musée** | https://neltud.github.io/xArtists/#/museum |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_LIVE SC** — packs **déverrouillés par hash runtime** — LIA **paper** — spin REAL **fermé** |
| **Indexer** | healthy · epoch **2265** · refreshRate **600** |
| **Supernova** | LIVE depuis le 10 sept 2026 · epoch 2233 · **32 epochs** plus tard |
| **EGLD** | **$3,70** API · mcap **$114,6M** · circ 30,98M · staked 14,27M · APR **8,88 %** |
| **LIA Ops** | **1,603782 EGLD** · nonce **1473** (inchangé) |
| **Slot** | **0,5000 EGLD** · `isPayable=false` · min bet 0,001 · spin count 0 |
| **Market** | **0,0175 EGLD** · payable · fees 0,0075 + bid 0,01 |
| **Agents SC** | **0,013 EGLD** · endpoint `buyPack` payable · getPackPrice **10 / 5 / 2.5** EGLD |
| **$TRO** | circ 476 224 · 562 comptes · ~$0,000080 · mcap ~$38 |

**Build.** `static.yml` est rouge depuis le commit live-sign du 16 oct 14:34 UTC : `LiaSignalPanel` importe `buildUserSignPayload`, qui n’était pas exporté. Les déploiements « pages » verts d’après sont le bot Pages sur des ticks `[skip ci]`, pas un rebuild Vite. Le public servait encore **0.111.0**. Ce push exporte la fonction (en paper : `tx: null`), branche le journal Command Center sur l’événement `lia-user-intent`, et **remet `VITE_LIA_LIVE_TRADING=0`** — le `=1` du workflow n’a jamais atteint GitHub Pages. Stamp bundle `0.113.0`.

---

## Couches produit

| Layer | Rôle | État 17 oct |
|-------|------|-------------|
| Studio / Gallery | NFT collections (NFTUDURI) | Lecture API live |
| Marketplace | List / Buy / Bid | SC live · listing #2 0,25 EGLD · #1 mort |
| Agents | Packs Pulse · Yield · Sentinel | SC live · runtime unlock · prix 10/5/2.5 |
| LIA | Agent autonome Guardian → Brain | **paper** · 1,60 EGLD ops |
| $TRO | Utility token | Stake prouvé · illiquide |
| Slot | Primordial Slot | House 0,5 · REAL fermé |
| Venues / DAO / Escrow / Treasury | Auxiliaires | codeHash live · treasury dest null |

---

## Veille technologique (17 oct)

### MultiversX / protocole
- Supernova 600 ms stable · epoch 2265 · refreshRate 600.
- Indexer `api.multiversx.com` HTTP 200 (stats, economics, accounts, query).
- sdk : front sur `@multiversx/sdk-dapp` ^3 + Vite 5. `@multiversx/sdk-network-providers` déprécié (intégré sdk-core).
- Pas de changement protocole à shipper cette semaine.

### Prix & CEX
- EGLD **$3,70** (−0,3 % vs 16 oct $3,71). Toujours loin des ~$4,60 du début octobre.
- **Upbit** (plus grand marché EGLD) : liste **investissement sous surveillance** depuis **21 sept** (~4 semaines, ~−2,5 %). Fenêtre de décision **19–23 octobre 2026**. Dépôts/retraits encore décrits haltés (retraits d’abord si reprise). ICX delist 19 oct ; SOPH/ZIL 16 nov. EGLD n’est **pas** sur la liste de delist décidée.
- Crypto.com : dépôts/retraits EGLD réouverts (12 oct).
- $TRO illiquide (562 comptes).

### NFT / agents
- OOX SDK (v0.1, 5 oct) non branché.
- XOXNO = lien externe historique.
- MX-8004 : LIA non inscrit agents.multiversx.com. First 100 non commencé.

### Hygiène front
- Deprecations npm (lodash.omit/isequal, uuid≤9, recharts 2.x, fontawesome 0.2, WalletConnect sign-client).
- Runtime SMART-UNLOCK (sessionStorage v4) + match codeHash explorer = source de vérité pour packs / market / stake sans secret Pages.
- Paper mint agents = `import.meta.env.DEV` only.

---

## Sécurité

- Acheter un pack **dépense de vrais EGLD** (10 / 5 / 2.5) et mint 1 NFT. Pas de paper mint en prod.
- Spin REAL reste fermé tant que compte slot non payable.
- Un TxHash journal LIA n’est « exécuté » que si API le voit succès et `sender` = wallet connecté.
- Placeholders legacy vides : **jamais** de fonds.
- Ne pas `claimFees` tant que destination trésorerie null.
- Emergency pause runbook + buyAgentAction warnings documentés (0.112.0).

---

## Suites logiques (ordre strict)

Voir [`SUITE_LOGIQUE_NOW.md`](./SUITE_LOGIQUE_NOW.md).

1. **Ce push** répare `static.yml` (export manquant) et republie le front. Vérifier le workflow vert, puis hard refresh.
2. **Attendre décision Upbit 19–23 oct** avant tout live trading LIA.
3. **1 TX user** micro (stake TRO / buy pack Sentinel / bid #2) documentée explorer.
4. Garder Slot REAL fermé.
5. Ne pas committer `VITE_*_CODEHASH_OK=1`.
6. Après Upbit OK : micro-trade LIA signé + MX-8004 + fund slot progressif.

---

## Posture publique

**GO_LIVE SC** · packs déverrouillés · LIA paper · pas un fonds retail · tips ≠ investissement · User Connect ≠ LIA Ops.

Hard refresh : Ctrl+Shift+R.

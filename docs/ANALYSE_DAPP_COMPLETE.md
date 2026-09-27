# Analyse DApp Complète xArtists — 27 septembre 2026

## Résumé exécutif

xArtists est une dApp **MultiversX mainnet** (lecture) : galerie NFT / phygital, marketplace fail-closed, $TRO (cap 500 000), DAO lecture, LIA v6 paper-first, Primordial Slot paper.

| | |
|---|---|
| **Live Pages** | https://neltud.github.io/xArtists/ |
| **Tour démo** | https://neltud.github.io/xArtists/#/demo |
| **GO_LIVE checklist** | https://neltud.github.io/xArtists/#/go-live |
| **Slot paper** | https://neltud.github.io/xArtists/#/slot |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_DEMO** — pas un marché live |
| **LIA** | `LIA_LIVE_TRADING=0` |
| **SC produit** | **codeHash null** (revérifié live 27 Sep) |
| **Indexer** | **healthy** — `/stats` `/economics` `/accounts` `/tokens` HTTP 200 |
| **Supernova** | LIVE 10 sept 2026 · epoch 2233 · probe epoch **2245** · 600 ms · **J+17** |
| **LIA Ops** | **2.0928 EGLD** (nonce **1468** — idle depuis ≥ 19 Sep) |
| **EGLD** | **$4.58** · mcap $141.2M · staked 14 330 127 · APR 8.81% |
| **Cran P0** | **dest treasury wallets = null** |

Pas un fonds retail.
Tips ≠ investissement.
User Connect ≠ LIA Ops.

## Verdict 27 sept

Galerie / `/demo` / `/go-live` / `/slot` live UI.
Market List/Buy/Bid **OFF** (SC empty).
Packs catalog paper.
Staking/gov/minter **empty** (codeHash null, balance 0, nonce 0).
LIA paper. Nonce ops **inchangé 1468** — aucune TX ops depuis au moins le 19 sept.
Treasury dest **null**.
RWA escrow experimental.
GSN/Contrarian non branchés live.
MX-8004 **not registered**.

**Delta vs 25 sept :**

- Epoch 2242 → **2245** (J+15 → J+17). Rounds ~50 % de l’epoch (71 588 / 144 000).
- Indexer **toujours 200** (recovery v2.1.3.0 tenue).
- EGLD $4.38 → **$4.58** (+4.6 %). Mcap $135M → **$141.2M**.
- Circ 30.82M → 30.83M. Staked 14.34M → **14.33M**. APR 8.84 → **8.81%**.
- LIA Ops **identique** 2.0928 EGLD / nonce 1468 — confirmé live, pas stale.
- GrokyversX 0 EGLD / nonce 8 — inchangé.
- TRO-94c925 inchangé : circ 476 224 / cap 500 000, 562 comptes, 2788 tx, prix API 0.
- NFTUDURI-2990b6 : **152 NFT**, **41 holders** (catalogue lisible).
- SC toujours empty — **aucune raison d’allumer** `VITE_*_CODEHASH_OK`.
- xExchange top20 TVL ~**$2.55M** (EGLDUSDC ~$1.72M, vol 24h ~$106k) — thin-liq, pas un signal live-trading.
- PulsAPI signalait API « degraded » le 26 ; probe public 27 sept = **200** sur les 4 endpoints.

Gate indexer = **passée** (tenue 48 h).
Gate LIA funded = **passée**.
Gate dest treasury = **échouée** ← **seul cran P0 restant avant wasm**.
Gate codeHash = **échouée** (attendu).

Deploy économiquement possible (gas). PEM hors git. Wasm non poussé **volontairement**.

## Probe API ~04:30 UTC 27 sept

stats: refreshRate **600**, epoch **2245**, roundsPerEpoch 144000, roundsPassed **71588** (~50 % epoch), accounts 9 263 970, tx 629 025 259, blocks 134 872 785, shards 3.

economics: EGLD **$4.58**, mcap $141 223 943, circ 30 834 922, staked 14 330 127, APR 8.81% (base 10.72%, top-up 6.40%).

TRO-94c925: initial 500 000, burnt ~23 776, circ **476 224**, 562 comptes, 2788 tx, decimals 6, paused=false. Owner `erd1mmh2j…nucj5l`.

NFTUDURI-2990b6 (ARTCOLLECTION): type NFT, **152** items, **41** holders. Œuvres lues : Meteorite, Artpocalypse Now, Serenity, Strange Cat, Co$miC Traveller, Father, Liberté, Antibes, Andreçjek, Oleg Portrait…

SC marketplace `…8354t` / staking `…xr8cl` / gov `…e0ca8` / minter `…nyztkn`: **codeHash null**, balance 0, nonce 0.

LIA Ops `erd1p4zyy…0crn6`: **2.0928 EGLD**, nonce 1468, shard 2.
GrokyversX `erd12c7f9…5gl`: **0 EGLD**, nonce 8, shard 1.

xExchange: EGLDUSDC TVL ~$1.72M, vol 24h ~$106k. Top20 TVL ~$2.55M.

## Suites logiques (ordre) — 27 sept

1. **Rester fail-closed.** Demo + lecture chain. Pas de List/Buy/Bid. Pas de live trading.
2. **P0 — dest treasury.** Remplir `data/contracts.json` `wallets.mission|reserve|reward|ops` (adresses réelles, hors git secrets). Tant que null : **pas de deploy wasm**, même si gas OK.
3. **Audit wasm + runbook** (`docs/SC_DEPLOY_COMMANDS.md`, `docs/RUNBOOK_DEPLOY_WEEK.md`) — timestamps Supernova (`refreshRate` 600 ms, **pas** `nonce * 6s`).
4. **Deploy SC depuis PEM vault** (hors git) uniquement si : indexer healthy (**oui**), LIA funded (**oui**), dest treasury **non-null**, wasm hash noté.
5. **Verify** `GET /accounts/{sc}` → `codeHash` non null → alors seulement flags `VITE_*_CODEHASH_OK`.
6. **First 100 / MX-8004** : inscription API possible ; ne pas promettre yield on-chain tant que staking empty.
7. **Paper LIA** jusqu’à Guardian + limites notional + kill-switch documentés. Nonce 1468 idle = pas d’activité ops à interpréter comme un live.
8. **Pas de Dependabot major** (Vite 8 / ESLint 10 / Vitest 4) / pas de Reality Switch « allumé ».

Le moteur `computeNextAction()` (front) matérialise cet ordre : indexer → fund → **treasury** → deploy → verify.

## Veille technologique — 27 sept 2026

### Supernova J+17

- Live 10 Sep 18:06 UTC, round 32 157 661, epoch 2233.
- 600 ms rounds, 144 000 rounds/epoch, epoch 24 h inchangée.
- Probe 27 Sep = **J+17**, epoch **2245** à mi-course.
- Builders : timestamps typés (`multiversx-sc` ≥ 0.63), ne plus multiplier nonce × 6 s.
- 400 ms / 200 ms évoqués sur télémétrie nœuds — **non calendrés** en activation mainnet.
- ZK natif = après stabilité 600 ms. Pas un input produit xArtists cette semaine.

### Indexer

- Recovery hardfork [v2.1.3.0](https://github.com/multiversx/mx-chain-mainnet-config/releases/tag/v2.1.3.0) (23 Sep).
- 24 Sep : `/economics` `/accounts` `/tokens` 500/404.
- 25 Sep : 200.
- **27 Sep : 200 tenus.** Compte LIA, TRO, collections relisibles.
- Signal tiers (PulsAPI, 26 Sep) « public API degraded » — **non reproduit** sur le probe public du 27. Garder le probe indépendant (stats/econ/accounts/tokens) : ne jamais geler l’epoch.

### EGLD / DeFi

- Prix API **$4.58** (vs $4.09 le 19, $4.38 le 25).
- Staked ~14.33M / circ ~30.83M.
- xExchange thin vs L1 majors — **pas un signal pour allumer LIA live**.
- TVL DEX top20 ~$2.55M. Vol EGLDUSDC 24h ~$106k (vs ~$175k le 19).

### Infra / RPC

- Source de vérité probe : `https://api.multiversx.com/`.
- Fallback 2026 : Tatum, node101, NODIT, NOWNodes, SonarX — secondaires.
- Akash indexer (`VITE_CATALOG_API`) : chemin catalogue musée, pas source de vérité SC.

### Produit xArtists (code 27 sept)

- Pages demo 10 steps + progress local + Slot paper + GO_LIVE next-action = surface démo complète **sans** prétendre le marché live.
- `FALLBACK_SNAPSHOT` aligné 27 Sep (plus le stale 24 Sep).
- `computeNextAction` : cran unique affiché (treasury dest).
- Secrets : aucun PEM/JWT dans git.
- Frontend 3.10.0 (Pages) + sdk-dapp externalisé (fix build 26 Sep).
- Musée : plus de double-weserv ; textures MVX media first (fix 26 Sep).

Non touché volontairement : live trading, PEM, flags codeHash, deploy SC, dest wallets (décision ops, pas un default).

## Code / vérité 27 sept

- `data/contracts.json` + copies `docs/data` + `apps/frontend/public/data` — snapshot live 27 Sep.
- `networkProbe` — endpoints indépendants ; fallback 27 Sep.
- `computeNextAction` — List/Buy seulement si address réelle **et** flag codeHash **et** dest treasury.
- `KNOWN_EMPTY_MARKETPLACE` = placeholder `…8354t` — never send funds.

## Recap opérateur (une ligne)

Indexer OK · LIA 2.09 EGLD · nonce 1468 idle · SC empty · **remplir dest treasury avant tout wasm**.

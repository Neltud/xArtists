# Analyse DApp Complète xArtists — 25 septembre 2026

## Résumé exécutif

xArtists est une dApp **MultiversX mainnet** (lecture) : galerie NFT / phygital, marketplace fail-closed, $TRO (cap 500 000), DAO lecture, LIA v6 paper-first.

| | |
|---|---|
| **Live Pages** | https://neltud.github.io/xArtists/ |
| **Tour démo** | https://neltud.github.io/xArtists/#/demo |
| **GO_LIVE checklist** | https://neltud.github.io/xArtists/#/go-live |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_DEMO** — pas un marché live |
| **LIA** | `LIA_LIVE_TRADING=0` |
| **SC produit** | **codeHash null** (vérifié live 25 Sep) |
| **Indexer** | **healthy** — `/stats` `/economics` `/accounts` `/tokens` HTTP 200 |
| **Supernova** | LIVE 10 sept 2026 · epoch 2233 · probe epoch **2242** · 600 ms · J+15 |
| **LIA Ops** | **2.0928 EGLD** (nonce 1468) — P0 fund **fait**, live |
| **EGLD** | **$4.38** · mcap $135.0M · staked 14 336 911 · APR 8.84% |

Pas un fonds retail.
Tips ≠ investissement.
User Connect ≠ LIA Ops.

## Verdict 25 sept

Galerie / `/demo` / `/go-live` / `/slot` live UI.
Market List/Buy/Bid **OFF** (SC empty).
Packs catalog paper.
Staking/gov/minter **empty** (codeHash null, balance 0, nonce 0).
LIA paper.
Treasury dest null.
RWA escrow experimental.
GSN/Contrarian non branchés live.

**Delta vs 24 sept :** indexer **rétabli**.
`/economics` `/accounts` `/tokens` passent de 500/404 → **200**.
LIA Ops reconfirmé **2.0928 EGLD** (plus stale).
EGLD $4.13 (livre, stale) → **$4.38 live**.
SC toujours empty — **aucune raison d’allumer** `VITE_*_CODEHASH_OK`.

Gate indexer (bloquante le 24) = **passée**.
Gate codeHash = **échouée** (attendu).
Deploy économiquement possible (gas). PEM hors git. Wasm non poussé.

## Probe API ~04:44 UTC 25 sept

stats: refreshRate **600**, epoch **2242**, roundsPerEpoch 144000, roundsPassed **122465** (~85 % epoch), accounts 9 262 950, tx 628 538 419, blocks 133 427 581, shards 3.

economics: EGLD **$4.38**, mcap $135.0M, circ 30 820 962, staked 14 336 911, APR 8.84%.

TRO-94c925: initial 500 000, burnt ~23 776, circ ~476 224, 562 comptes, 2788 tx, decimals 6, paused=false.

SC marketplace `…8354t` / staking `…xr8cl` / gov `…e0ca8` / minter `…nyztkn`: **codeHash null**, balance 0, nonce 0.

LIA Ops `erd1p4zyy…0crn6`: **2.0928 EGLD**, nonce 1468, shard 2.
GrokyversX `erd12c7f9…5gl`: **0 EGLD**, nonce 8, shard 1.

## Suites logiques (ordre)

1. **Rester fail-closed.** Demo + lecture chain. Pas de List/Buy/Bid.
2. **Audit wasm + runbook** (`docs/SC_DEPLOY_COMMANDS.md`, `docs/RUNBOOK_DEPLOY_WEEK.md`) — timing Supernova (`get_block_round_time_millis`, pas `nonce * 6s`).
3. **Deploy SC depuis PEM vault** (hors git) uniquement si : indexer healthy (**oui**), LIA funded (**oui**), wasm hash noté, dest treasury non-null **ou** splitter explicitement reporté.
4. **Verify** `GET /accounts/{sc}` → `codeHash` non null → alors seulement flags `VITE_*_CODEHASH_OK`.
5. **First 100 / MX-8004** : inscription possible côté API ; ne pas promettre yield on-chain tant que staking empty.
6. **Paper LIA** jusqu’à Guardian + limites notional + kill-switch documentés.
7. **Pas de Dependabot major** / pas de live trading / pas de Reality Switch « allumé ».

## Veille technologique — 25 sept 2026

### Indexer recovery post v2.1.3.0

- 23 Sep : recovery hardfork config [v2.1.3.0](https://github.com/multiversx/mx-chain-mainnet-config/releases/tag/v2.1.3.0) (atomicité VM / shadow-fork).
- 24 Sep : `/stats` OK, Elasticsearch accounts/econ/tokens **down**.
- **25 Sep 04:44 UTC** : les quatre endpoints publics répondent **200**. Compte LIA et TRO relisibles.
- Conséquence xArtists : la checklist `/go-live` peut passer le cran indexer. Le cran SC reste rouge.

### Supernova

- Live 10 Sep 18:06 UTC, round 32 157 661, epoch 2233.
- 600 ms rounds, 144 000 rounds/epoch, epoch 24 h inchangée.
- Probe 25 Sep = **J+15**, epoch 2242 presque finie.
- Builders : timestamps typés (`multiversx-sc` ≥ 0.63), ne plus multiplier nonce × 6 s.
- 400 ms évoqué, **non calendré**. ZK natif = après stabilité 600 ms.

### EGLD / DeFi context

- Prix API **$4.38** (vs $4.09 le 19, ~$4.13 livre le 24).
- Staked ~14.34M / circ ~30.82M.
- xExchange top pools toujours thin-liq vs L1 majors — pas un signal pour allumer LIA live.

### Infra / RPC

- Public : `https://api.multiversx.com/` (utilisé pour ce probe).
- Autres 2026 : Tatum, node101, NODIT, NOWNodes, SonarX — utiles en fallback probe, pas en source de vérité unique.

### Produit xArtists

- Pages demo 10 steps + Slot paper + GO_LIVE gates = surface démo complète **sans** prétendre le marché live.
- Secrets : aucun PEM/JWT dans git.

## Code / vérité 25 sept

- `data/contracts.json` + copies `docs/data` + `apps/frontend/public/data` — snapshot live.
- `networkProbe` — endpoints indépendants (stats/econ/accounts/tokens).
- `scStatus.ts` — List/Buy seulement si address réelle **et** flag codeHash.
- `KNOWN_EMPTY_MARKETPLACE` = placeholder `…8354t` — never send funds.

Non touché volontairement : live trading, PEM, flags codeHash, deploy SC.

# Analyse DApp complète xArtists — 1er octobre 2026

## Résumé exécutif

xArtists est une dApp **MultiversX mainnet**. Galerie NFT / phygital, marketplace **SC live**, $TRO (cap 500 000), DAO lecture, LIA v6 **paper-first**, Slot **house funded**.

| | |
|---|---|
| **Live Pages** | https://neltud.github.io/xArtists/ |
| **Tour** | https://neltud.github.io/xArtists/#/demo |
| **GO_LIVE checklist** | https://neltud.github.io/xArtists/#/go-live |
| **Repo** | https://github.com/Neltud/xArtists |
| **Release** | **0.72.1** (1 oct 2026) |
| **Posture** | **GO_LIVE SC** — trading LIA **paper** |
| **LIA** | `LIA_LIVE_TRADING=0` |
| **SC produit** | **10/10 codeHash non-null** (probe 1 oct) |
| **Indexer** | **healthy** — `/stats` `/economics` `/accounts` `/tokens` HTTP 200 |
| **Supernova** | LIVE 10 sept 2026 · epoch 2233 · probe epoch **2249** · 600 ms · J+16 |
| **LIA Ops** | **2.0932 EGLD** (nonce 1468) |
| **Slot house** | **0.5000 EGLD** |
| **EGLD** | **$4.45** · mcap $137.3M · staked 14 320 896 · APR 8.85% |

Pas un fonds retail.
Tips ≠ investissement.
User Connect ≠ LIA Ops.

## Verdict 1er oct

Galerie / `/demo` / `/go-live` / `/slot` / `/marketplace` live UI.

| Surface | État |
|---|---|
| Marketplace List/Buy/Bid | **ON si runtime codeHash match** (plus empty) |
| Packs Pulse · Yield · Sentinel | SC agents **live** |
| Slot | **LIVE** · house 0.5 EGLD · FUN/REAL |
| Staking TRO | **LIVE** (redeploy 29 sept, dust 1 TRO OK) |
| NFT staking / gov / escrow / treasury / venue | **codeHash live**, balance 0 |
| LIA trading | **paper** |
| MX-8004 Identity | API gate unblocked — inscription First 100 encore à faire |
| GSN / Contrarian | non branchés live |

**Delta vs 25 sept :** le recap du 25 disait « SC empty / codeHash null ». C’était **vrai pour les placeholders legacy** (`…8354t`, `…xr8cl`, `…e0ca8`, `…nyztkn`) — **faux pour les SC produit déployés fin septembre**. Le probe front lisait encore les anciens comptes. Corrigé 1 oct : `networkProbe` + `contracts.ts` pointent les adresses `data/contracts.json`.

Gate indexer = **passée**.
Gate codeHash produit = **passée** (explorer).
Gate LIA live trading = **fermée** (volontaire).
PEM hors git.

## Probe API ~15:00 UTC 1 oct 2026

stats: refreshRate **600**, epoch **2249**, roundsPerEpoch 144000, roundsPassed **134625** (~93 % epoch), accounts 9 265 958, tx 629 788 386, blocks 137 415 894, shards 3.

economics: EGLD **$4.45**, mcap $137.3M, circ 30 863 023, staked 14 320 896, APR 8.85%.

TRO-94c925: initial 500 000, burnt ~23 776, circ **476 224**, **565** comptes, **2797** tx, decimals 6, paused=false, 24h vol ~$0.008.

NFTUDURI-2990b6: **152** NFTs, **41** holders.

LIA Ops `erd1p4zyy…0crn6`: **2.0932 EGLD**, nonce 1468, shard 2.
GrokyversX `erd12c7f9…5gl`: **0 EGLD**, nonce 8, shard 1.

### Smart contracts (live)

| SC | Adresse (suffixe) | codeHash | EGLD |
|---|---|---|---|
| venue-split | `…2vje2y` | `SRrGio4i…T1owuY=` | 0 |
| nft-marketplace | `…q8txmm` | `8TTszCmN…sZBgFc=` | 0 |
| agents-marketplace | `…gdqwsg` | `tDIcnNMb…CALFUWs=` | 0 |
| nft-staking | `…q4fgtgu` | `hXcRjpcl…fnMuME=` | 0 |
| tro-staking | `…qpe3xf3` | `Jf5ZhzAG…pGq7SA=` | 0 |
| tro-governance | `…q9e9euy` | `+9aNhboF…74UOsQ=` | 0 |
| agent-stake-escrow | `…qndvzr3` | `Hs3AClbY…mlSnE=` | 0 |
| treasury-splitter | `…q2nkezv` | `9pB9+UN3…Lnpk8=` | 0 |
| slot-casino | `…qs4g34f` | `UZ0nX6dW…6VJCs=` | **0.5** |

**Ne jamais financer** les placeholders legacy empty.

## Suites logiques (ordre — 1 oct)

1. **Rester honnête.** SC live ≠ LIA live. Pas de promesse de yield. Pas un fonds.
2. **1 TX user réelle** (dust) : stake 1 TRO **ou** micro-list NFT **ou** spin FUN puis REAL micro. C’est la preuve produit.
3. **Ne pas** committer `VITE_*_CODEHASH_OK=1` — le runtime explorer match suffit (v3 cache).
4. **Ne pas** allumer `LIA_LIVE_TRADING=1` tant que : Guardian + notional caps + kill-switch + 1 micro-trade LIA documentés.
5. **MX-8004 / First 100** : inscrire LIA (identity soulbound) maintenant que l’API gate n’est plus bloquée. Pas de yield on-chain promis.
6. **Treasury dest** : splitter live mais dest wallets encore à confirmer côté ops (PR #87).
7. **Exchanges** : dépôts/retraits EGLD se rouvrent progressivement (Binance US OK 30 sept ; 5–10 jours pour le reste — note Beniamin 1 oct). Pas un signal pour lever les caps LIA.
8. **Dependabot majors** (PRs #4–#8, #28–#32) : ne pas merger vite/eslint/vitest majors pendant la fenêtre live.

## Veille technologique — 1er oct 2026

### Incident VM 19–21 sept + recovery

- 19 sept : anomalie mainnet. 20 sept : pause, exploit atomicité VM.
- 21 sept : comptes attaquant gelés. Hardfork recovery **v2.1.3.0** + **v2.1.5.0**.
- 25 sept : indexer accounts/econ/tokens **rétabli**.
- 28 sept : pont MVX–ETH rouvert ; staking rewards expliqués ; record 21 798 TPS (Chainspect).
- 30 sept : **Binance US** redépôts/retraits EGLD.
- 1 oct : Beniamin — Supernova « remarkable speed » ; 5–10 jours pour le reste des exchanges ; analyse sécu en cours ; sophistication type **Lazarus** évoquée, **non confirmée**. Fonds utilisateurs protégés.

Conséquence xArtists : **ne pas** augmenter le notional LIA. House Slot 0.5 EGLD = plafond volontaire. Safety switch paper reste.

### Supernova

- Live 10 Sep 18:06 UTC, round 32 157 661, epoch 2233.
- 600 ms rounds, 144 000 rounds/epoch, epoch 24 h.
- Probe 1 oct = **J+16**, epoch 2249 (~93 %).
- Builders : timestamps typés (`multiversx-sc` ≥ 0.63), jamais `nonce × 6 s`.
- 400 ms évoqué, **non calendré**. ZK natif = après stabilité 600 ms.

### EGLD / DeFi

- Prix API **$4.45** (vs $4.38 le 25, ~$4.30 CEX 1 oct).
- Staked ~14.32M / circ ~30.86M.
- xExchange TVL ~$4.6M (28 sept) — thin-liq vs L1 majors. Pas un signal LIA live.
- Upbit review window EGLD ~19–23 oct (caution post-incident).

### Agents / MX-8004

- ERC-8004 : ~520k identités / 14 chains (29 sept, Turnkey). Concentration BNB/Base/ETH.
- MX-8004 : identity + validation + reputation, Agent Explorer. First 100 xArtists = inscription LIA, pas un marketplace d’agents retail.
- Stack agentic MVX : UCP, ACP/AP2, x402, MCP 14 tools, Relayed v3 gasless.

### Infra / RPC

- Public : `https://api.multiversx.com/` (ce probe).
- Fallbacks 2026 : Tatum, node101, NODIT, NOWNodes, SonarX — probe only.

### Produit xArtists (code 1 oct)

- Runtime unlock v3 : 9 SC (slot, market, agents, tro stake, nft stake, venue, gov, escrow, treasury).
- `networkProbe` ne lit plus les placeholders empty.
- `GoLivePage` suit l’explorer, plus seulement les secrets Pages.
- Audio React #185 fixé (0.72.1).
- Secrets : aucun PEM/JWT dans git.

## Code / vérité 1 oct

- `data/contracts.json` — SoT adresses + **tous** les codeHash.
- `apps/frontend/src/config/contracts.ts` — même SoT côté front.
- `runtimeCodehash.ts` — match explorer, cache session v3.
- `scStatus.ts` — `can*` = env flag **ou** runtime match.
- Legacy empty = `never_fund` dans contracts.json.

Non touché volontairement : live trading LIA, PEM, flags CODEHASH commitées, dest treasury.

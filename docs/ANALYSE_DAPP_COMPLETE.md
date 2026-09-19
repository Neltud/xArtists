# Analyse DApp Complète xArtists — 19 septembre 2026

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
| **SC produit** | **codeHash null** |
| **Supernova** | LIVE 10 sept 2026 · epoch 2233 · probe epoch **2241** · 600 ms J+8 (calendrier J+9) |
| **LIA Ops** | **~2.09 EGLD** (nonce 1468) — P0 fund **fait** |

Pas un fonds retail. Tips ≠ investissement. User Connect ≠ LIA Ops.

## Verdict 19 sept

Galerie / `/demo` / `/go-live` live UI. Market List/Buy/Bid OFF. Packs catalog paper. Staking/gov/minter empty. LIA paper. Treasury dest null. RWA escrow experimental. GSN/Contrarian non branchés.

**Delta vs 17 sept :** LIA Ops 0.093 → **2.09 EGLD** (+2). Deploy économiquement possible. PEM toujours hors git. SC toujours empty.

## Probe API ~04:35 UTC 19 sept

stats: refreshRate 600, epoch **2241**, roundsPerEpoch 144000, roundsPassed 63226, accounts 9 262 882, tx 628 518 764, blocks 133 351 539.

economics: EGLD **$4.09**, mcap $126.0M, circ 30 816 932, staked 14 356 598, APR 8.82%.

xExchange top20 TVL ~$2.43M (EGLDUSDC ~$1.65M, vol 24h ~$175k).

TRO-94c925: supply 476 224 / 500 000, 562 comptes, 2788 tx, prix API 0, liq. ~$1.13.

SC marketplace/staking/gov/minter: codeHash null, balance 0.
LIA Ops erd1p4zyy…0crn6: **2.093 EGLD**, nonce 1468 — **suffisant deploy**.
GrokyversX erd12c7f9…5gl: 0 EGLD, nonce 8.

## Code 19 sept

- `networkProbe` — /stats /economics /accounts /tokens live (plus d’epoch figé)
- `NetworkLiveStrip` sur Home
- `/demo` gates live (LIA funded, codeHash)
- `/go-live` checklist opérateur
- `assertTreasuryDest` fail-closed
- contracts.json probe 19 sept
- recap + veille 19 sept

Non touché: live trading, PEM, Dependabot majors, deploy SC (volontaire — PEM hors git).

## Veille technologique

- **Supernova** live J+9 calendrier. Activation 10 sept 18:06:06 UTC, round 32 157 661, epoch 2233. 600 ms, 144 000 rounds/epoch, finalité ~170 ms. Config v2.0.9.0 (14 sept).
- Suite protocole (équipe MvX) : semaines de stabilité 600 ms **avant** ZK natif et I/O state. 400 ms évoqué, non calendré.
- **sdk-dapp v5** = doc standard ; front xArtists encore v3 — migration **après** codeHash, pas avant.
- SC : typed time (`multiversx-sc >= 0.63.1`, `get_block_round_time_millis`) obligatoire avant deploy 600 ms.
- FixEpochChange 2238 derrière nous. RWA : pas de claim live.
- EGLD +6 % vs 17 sept ($3.85 → $4.09) après le dump post-fork ($5.8 → $3.7). Livres DEX minces — paper d’abord.

## P0 — suite logique (ordre)

1. **Wallets treasury dest** (mission / reserve / reward / ops) — encore **null**
2. **PEM opérateur** en coffre local — jamais chat / git / Vellum logs
3. `./scripts/runbook_deploy.sh dry` puis **deploy market + agents** (LIA Ops ~2.09 EGLD suffit)
4. `verify_marketplace_codehash.py` — flags Pages **seulement** si hash non null
5. Treasury splitter
6. Revue SC typed-time
7. Paper stable **puis** micro live — jamais un saut

*Neltud via Grok — 19 septembre 2026*

---

## Archive 17 sept

Probe epoch 2239, EGLD $3.85, LIA Ops 0.093 EGLD. `/demo` tour 8 étapes. Voir git history efaa895 / fcef003.

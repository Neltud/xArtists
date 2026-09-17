# Analyse DApp Complète xArtists — 17 septembre 2026

## Résumé exécutif

xArtists est une dApp **MultiversX mainnet** (lecture) : galerie NFT / phygital, marketplace fail-closed, $TRO (cap 500 000), DAO lecture, LIA v6 paper-first.

| | |
|---|---|
| **Live Pages** | https://neltud.github.io/xArtists/ |
| **Tour démo** | https://neltud.github.io/xArtists/#/demo |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | **GO_DEMO** — pas un marché live |
| **LIA** | `LIA_LIVE_TRADING=0` |
| **SC produit** | **codeHash null** |
| **Supernova** | LIVE 10 sept 2026 · epoch 2233 · probe epoch **2239** · 600 ms J+7 |

Pas un fonds retail. Tips ≠ investissement. User Connect ≠ LIA Ops.

## Verdict 17 sept

Galerie / `/demo` live UI. Market List/Buy/Bid OFF. Packs catalog paper. Staking/gov/minter empty. LIA paper. Treasury dest null. RWA escrow experimental. GSN/Contrarian non branchés.

## Probe API ~04:47 UTC

stats: refreshRate 600, epoch 2239, roundsPerEpoch 144000, accounts 9 262 140, tx 628 131 655, blocks 132 207 324.

economics: EGLD $3.85, mcap $118.6M, circ 30 802 852, staked 14 322 604, APR 8.83%.

xExchange top20 TVL ~$1.82M (EGLDUSDC ~$1.60M).

TRO-94c925: supply 476 224 / 500 000, 563 comptes, 2787 tx, prix API 0.

SC marketplace/staking/gov/minter: codeHash null, balance 0.
LIA Ops erd1p4zyy…0crn6: 0.093 EGLD, nonce 1468 — insuffisant deploy.

## Code 17 sept

- route `/demo` tour 8 étapes + gates
- export supernovaBannerText
- DEMO_PATH Tour + Board
- contracts.json probe 17 sept

Non touché: live trading, PEM, Dependabot majors, deploy SC.

## Veille

Supernova live J+7. Checklist SC typed time (multiversx-sc >= 0.63.1, get_block_round_time_millis). FixEpochChange 2238 derrière nous. sdk-dapp v5 = doc standard, front encore v3. RWA: pas de claim live.

## P0

1. Wallets treasury dest
2. Fund LIA Ops
3. Deploy market + agents + verify codeHash
4. post_deploy + flags Pages seulement si hash non null
5. Treasury splitter
6. paper stable puis micro live
7. revue SC typed-time

*Neltud via Grok — 17 septembre 2026*

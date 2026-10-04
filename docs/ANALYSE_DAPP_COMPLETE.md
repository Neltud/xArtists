# Analyse DApp complète xArtists — 4 octobre 2026

## Mise à jour 4 oct (veille + correctif go-live)

Le site Pages https://neltud.github.io/xArtists/ sert encore le dernier build Vite réussi. Le push du 3 oct (`708adc7`, panneau LIA Shadow) a cassé le build Pages : `canUseVenue` importé par `GoLivePage.tsx` n'était pas exporté par `scStatus.ts` (le gate existait sous `canRentVenueOnChain`). Correctif : alias `canUseVenue` + rappel honnête sur `/go-live` (spin REAL fermé).

| Sujet | État au 4 oct |
|---|---|
| Front | Build cassé au 3 oct, correctif poussé pour relancer `static.yml` |
| Spin REAL | Toujours fermé (`REAL_SPIN_READY = false`). FUN = chemin démo |
| LIA | Paper. `LIA_LIVE_TRADING` reste à 0 |
| Marketplace | SC live + 1 vente ASFT prouvée. Carnet NFTUDURI 1/1 pas « ouvert » |
| Treasury | Fee 0,0075 EGLD non routée tant que la dest treasury n'est pas figée |
| MX-8004 | Inscription LIA soulbound = suite, pas un yield |
| Chaîne | Mainnet repris après pause du 19–24 sept (exploit VM atomicité, upgrade recovery). Supernova actif (600 ms depuis le 10 sept, epoch 2233). Pont ETH rouvert le 25 sept. Chaque exchange finit ses checks — pas un signal pour lever les caps |
| Fenêtre exchanges interne | 6–11 oct encore devant. Observer seulement |

Suites dans l'ordre : (1) rebuild Pages vert, (2) diagnostic `spinEgld` avant tout REAL, (3) prochain listing 1/1 avec les 3 args ABI, (4) dest treasury avant de router le fee, (5) MX-8004, (6) ne pas merger les majors Dependabot pendant la fenêtre live.

---

# Analyse DApp — archive 2 octobre 2026

## Résumé exécutif

xArtists est une dApp **MultiversX mainnet**. Galerie NFT / phygital, marketplace **SC live + 1 vente prouvée**, $TRO (cap 500 000), DAO lecture, LIA v6 **paper-first**, Slot **house funded**.

| | |
|---|---|
| **Live Pages** | https://neltud.github.io/xArtists/ |
| **Tour** | https://neltud.github.io/xArtists/#/demo |
| **GO_LIVE checklist** | https://neltud.github.io/xArtists/#/go-live |
| **Repo** | https://github.com/Neltud/xArtists |
| **Release** | **0.77.0** (2 oct 2026) · PR 0.77.1 ouverte |
| **Posture** | **GO_LIVE SC** — trading LIA **paper** |
| **LIA** | `LIA_LIVE_TRADING=0` |
| **SC produit** | **9/9 codeHash non-null** (probe 2 oct, match 1 oct) |
| **Indexer** | **healthy** — `/stats` `/economics` `/accounts` `/tokens` HTTP 200 |
| **Supernova** | LIVE 10 sept 2026 · epoch 2233 · probe epoch **2251** · 600 ms · **J+22** |
| **LIA Ops** | **2.1057 EGLD** (nonce 1468) |
| **Slot house** | **0.5000 EGLD** |
| **Market fee** | **0.0075 EGLD** (3 % de 0,25) |
| **EGLD** | **$4.40** · mcap $135.9M · staked 14 294 751 · APR 8.87% |

Pas un fonds retail.
Tips ≠ investissement.
User Connect ≠ LIA Ops.

## Verdict 2 oct

Galerie / `/demo` / `/go-live` / `/slot` / `/marketplace` live UI.

| Surface | État |
|---|---|
| Marketplace List/Buy | **SC live** · 1 vente **ASFT 0,25 EGLD** epoch 2250 · carnet **vide** |
| Packs Pulse · Yield · Sentinel | SC agents **live** · checkout paper |
| Slot | **LIVE** · house 0,5 EGLD · FUN ouvert · REAL dernier `spinEgld` **fail** |
| Staking TRO | **LIVE** · stake 1 TRO + unstake 1 TRO prouvés · **1 TRO** dust restant |
| NFT staking / gov / escrow / treasury / venue | **codeHash live**, balance 0 |
| LIA trading | **paper** |
| MX-8004 Identity | API gate unblocked — **First 100 pas inscrit** |
| Treasury dest | **null** (PR #87) |
| GSN / Contrarian | non branchés live |

**Delta vs 1er oct :**
- Epoch 2249 → **2251** (J+16 déclaré → **J+22** réel depuis le 10 sept).
- EGLD $4.45 → **$4.40**.
- LIA Ops 2.0932 → **2.1057** EGLD, nonce **inchangé 1468** (incoming, pas de TX sortante).
- Deployer 0.84 → **0.339** EGLD (nonce 22→24) après seed house 0,5.
- **Preuve produit :** `listNft` + `buyNft` 0,25 EGLD (ASFT-a6273a-01). Fee 3 % = 0,0075 restant sur le market.
- `listNft` ALISTOR **fail** (royalty_receiver manquant — ABI 3 args, fix 0.73.0).
- `spinEgld` REAL 0,1 EGLD **fail**, house intacte.
- TRO stake/unstake 1 TRO **success**. Dust restant **1 TRO** (plus 2).
- Release **0.77.0** : sold overlay + Dashboard LIVE from explorer.
- `docs/STATUS.md` du **15 sept** (codeHash null, LIA 0.093) était **périmé** — corrigé ici.
- `docs/DEMO_WALKTHROUGH.md` du **24 sept** (SC non déployés) était **périmé** — corrigé ici.

Gate indexer = **passée**.
Gate codeHash produit = **passée**.
Gate 1 TX user = **passée** (vente + stake).
Gate LIA live trading = **fermée** (volontaire).
Gate REAL slot public = **fermée** (dernier spin fail).
PEM hors git.

## Probe API ~20:40 UTC 2 oct 2026

stats: refreshRate **600**, epoch **2251**, roundsPerEpoch 144000, roundsPassed **24630** (~17 % epoch), accounts 9 266 373, tx 629 995 848, blocks 138 126 529, shards 3.

economics: EGLD **$4.40**, mcap $135.9M, circ 30 877 174, staked 14 294 751, APR 8.87%.

TRO-94c925: initial 500 000, burnt ~23 776, circ **476 224**, **565** comptes, **2797** tx, decimals 6, paused=false, 24h vol 0, liq ~$7.13.

NFTUDURI-2990b6: **152** NFTs, **41** holders.

LIA Ops `erd1p4zyy…0crn6`: **2.1057 EGLD**, nonce 1468, shard 2.
Deployer `erd1kex0p…vl8v0g`: **0.3393 EGLD**, nonce 24, shard 0.
Artiste `erd1mmh2j…nucj5l`: émetteur des TX produit (list/buy/stake/spin).

### Smart contracts (live, hashes inchangés)

| SC | Suffixe | codeHash | EGLD |
|---|---|---|---|
| venue-split | `…2vje2y` | `SRrGio4i…T1owuY=` | 0 |
| nft-marketplace | `…q8txmm` | `8TTszCmN…sZBgFc=` | **0.0075** |
| agents-marketplace | `…gdqwsg` | `tDIcnNMb…CALFUWs=` | 0 |
| nft-staking | `…q4fgtgu` | `hXcRjpcl…fnMuME=` | 0 |
| tro-staking | `…qpe3xf3` | `Jf5ZhzAG…pGq7SA=` | 0 (+ **1 TRO**) |
| tro-governance | `…q9e9euy` | `+9aNhboF…74UOsQ=` | 0 |
| agent-stake-escrow | `…qndvzr3` | `Hs3AClbY…mlSnE=` | 0 |
| treasury-splitter | `…q2nkezv` | `9pB9+UN3…Lnpk8=` | 0 |
| slot-casino | `…qs4g34f` | `UZ0nX6dW…6VJCs=` | **0.5** |

**Ne jamais financer** les placeholders legacy empty (`…8354t`, `…xr8cl`, `…e0ca8`, `…nyztkn`).

### Preuves TX (explorer)

| fn | status | epoch | hash |
|---|---|---|---|
| `fundProgressiveEgld` 0,5 | success | 2249 | `aea3eace…9ccacbf` |
| `listNft` ALISTOR-07 | **fail** | 2250 | `9e1c0581…4dfd544` |
| `listNft` ASFT-01 @ 0,25 | success | 2250 | `7e4182db…3cb26cc1` |
| `buyNft` 0,25 EGLD | success | 2250 | `57b7b5e2…b801806e` |
| `spinEgld` 0,1 | **fail** | 2250 | `27c28319…c90de497` |
| `stake` 1 TRO | success | 2248 | `623a01cf…3748eb46` |
| `unstake` 1 TRO | success | 2250 | `3b32cd51…1e8155e2` |

Le fail ALISTOR = ABI `listNft(price, royalty_bps, royalty_receiver)` — le 3e arg manquait. Corrigé côté front depuis 0.73.0 ; la TX a précédé ou contourné le guard.

La vente n'est **pas** un 1/1 NFTUDURI. Overlay SOLD + carnet vide = vérité indexer.

## Suites logiques (ordre — 2 oct)

1. **Rester honnête.** SC live + 1 vente ASFT ≠ marché NFTUDURI ouvert. Pas de promesse de yield. Pas un fonds.
2. **Diagnostiquer `spinEgld` REAL** (fail 0,1, house intacte) avant d'ouvrir le spin public REAL. FUN reste le chemin démo.
3. **Prochain listing 1/1 NFTUDURI** : `price` + `royalty_bps` + `royalty_receiver`. Vérifier indexer avant tout discours « marché ouvert ».
4. **Treasury dest** (PR #87) **avant** de router les 0,0075 EGLD de fee vers LIA / fondation.
5. **MX-8004 / First 100** : inscrire LIA (soulbound). Pas un yield on-chain.
6. **Ne pas** committer `VITE_*_CODEHASH_OK=1` — le runtime explorer match suffit (v3 cache, 0.71+).
7. **Ne pas** allumer `LIA_LIVE_TRADING=1` tant que : Guardian + notional caps + kill-switch + 1 micro-trade LIA documentés.
8. **Exchanges** : fenêtre 6–11 oct (Beniamin 1 oct). Observer. **Pas** un signal pour lever les caps.
9. **Dependabot majors** (PRs #4–#8, #28–#32) : ne pas merger vite/eslint/vitest majors pendant la fenêtre live.
10. **Fermer / mettre à jour PR #87** avec l'état treasury actuel (dest toujours null).

## Veille technologique — 2 oct 2026

### Incident VM 19–21 sept + recovery

- 19 sept : anomalie mainnet. 20 sept : pause, exploit atomicité VM.
- 21 sept : comptes attaquant gelés. Hardfork recovery **v2.1.3.0** + **v2.1.5.0**.
- 25 sept : indexer accounts/econ/tokens **rétabli**. Pont MVX–ETH rouvert.
- 28 sept : record 21 798 TPS (Chainspect) ; xExchange TVL ~$4.60M.
- 30 sept : dépôts/retraits EGLD **Binance** rouverts.
- 1 oct : Beniamin — Supernova « remarkable speed » ; 5–10 jours pour le reste des CEX ; sophistication type **Lazarus** évoquée, **non confirmée**. Fonds utilisateurs protégés.
- 2 oct : fenêtre CoinMarketCal **6–11 oct** pour la vague CEX. Upbit review ~19–23 oct.

Conséquence xArtists : **ne pas** augmenter le notional LIA. House Slot 0,5 EGLD = plafond volontaire. Safety switch paper reste. Première vente 0,25 ≠ feu vert retail.

### Supernova

- Live 10 Sep 18:06 UTC, round 32 157 661, epoch 2233.
- 600 ms rounds, 144 000 rounds/epoch, epoch 24 h.
- Probe 2 oct = **J+22**, epoch 2251 (~17 %).
- Builders : timestamps typés (`multiversx-sc` ≥ 0.63), jamais `nonce × 6 s`.
- 400 ms évoqué, **non calendré**. ZK natif = après stabilité 600 ms.

### EGLD / DeFi

- Prix API **$4.40** (vs $4.45 le 1er, $4.38 le 25).
- Staked ~14.29M / circ ~30.88M.
- xExchange TVL ~$4.6M — thin-liq vs L1 majors. Pas un signal LIA live.
- $TRO liq ~$7 — illiquide. Prix API 0.

### Agents / MX-8004

- ERC-8004 : 537k+ identités (25 sept, 8004scan).
- MX-8004 : identity + validation + reputation, Agent Explorer. First 100 xArtists = inscription LIA, **pas faite**.
- Stack agentic MVX : UCP, ACP/AP2, x402, MCP 14 tools, Relayed v3 gasless.

### Infra / RPC

- Public : `https://api.multiversx.com/` (ce probe).
- Fallbacks 2026 : Tatum, node101, NODIT, NOWNodes, SonarX — probe only.

### Produit xArtists (code 2 oct)

- Runtime unlock v3 : 9 SC.
- 0.73 : Wallet / Venue / Identity / DAO / Desk / LIA / Studio mint loop.
- 0.74 : Frameit + first listing index + pack rooms 3D + pots/fees.
- 0.75 : i18n 7 langues + Command Center.
- 0.76 : aura 4 modes + nav desktop.
- **0.77.0** : marketplace sold overlay + Dashboard LIVE from explorer proof + multi-TX broadcast.
- Secrets : aucun PEM/JWT dans git.

## Code / vérité 2 oct

- `data/contracts.json` — SoT adresses + codeHash (snapshot 1 oct, **reconfirmé 2 oct**).
- `apps/frontend/src/config/contracts.ts` — même SoT côté front.
- `runtimeCodehash.ts` — match explorer, cache session v3.
- `scStatus.ts` — `can*` = env flag **ou** runtime match.
- Legacy empty = `never_fund` dans contracts.json.
- STATUS.md / DEMO_WALKTHROUGH.md **réécrits** (plus de 15 sept / 24 sept).

Non touché volontairement : live trading LIA, PEM, flags CODEHASH committées, dest treasury, REAL slot public.

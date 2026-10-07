# Analyse DApp complète xArtists — 7 octobre 2026

## Verdict

xArtists est une dApp **MultiversX mainnet**. SC produit **9/9 LIVE** (codeHash inchangés).  
**GitHub Pages était rouge** depuis le 6 oct (0.90.0) : cleanup orphan a cassé `Agents.tsx` / `MyPacks.tsx` / `Tip.tsx` + imports LIA manquants. **Correctif poussé aujourd’hui** pour relancer `static.yml`.

Pas un fonds retail. Tips ≠ investissement. User Connect ≠ LIA Ops.  
`LIA_LIVE_TRADING=0`. Spin REAL fermé. Treasury dest **null**.

| | |
|---|---|
| **Live Pages** | https://neltud.github.io/xArtists/ |
| **Tour** | https://neltud.github.io/xArtists/#/demo |
| **GO_LIVE** | https://neltud.github.io/xArtists/#/go-live |
| **Repo** | https://github.com/Neltud/xArtists |
| **Release** | **0.90.0** (6 oct) + hotfix Pages **7 oct** |
| **Posture** | **GO_LIVE SC** — LIA **paper** |
| **Indexer** | healthy · epoch **2255** · refreshRate **600** |
| **Supernova** | LIVE 10 sept 2026 · epoch 2233 · probe **J+27** |
| **EGLD** | **$4.14** · mcap $127.9M · staked 14.24M · APR 8.90% |
| **LIA Ops** | **1.604 EGLD** · nonce **1473** |
| **Slot house** | **0.5000 EGLD** |
| **Market SC** | **0.0175 EGLD** (0.0075 fee + 0.01 bid) |

---

## Probe API — 7 oct 2026 ~04:30 UTC

stats: refreshRate **600**, epoch **2255**, roundsPerEpoch 144000, roundsPassed **71819** (~50 %), accounts 9 267 930, tx 630 744 240, blocks 140 602 575, shards 3.

economics: EGLD **$4.14**, mcap $127.9M, circ 30 905 326, staked 14 243 938, APR 8.90%.

TRO-94c925: circ **476 224**, burnt ~23 776, **563** comptes, **2808** tx, decimals 6, paused=false, **prix API ~$0.000093**, mcap ~$44.50.

NFTUDURI-2990b6: **152** NFTs, **41** holders.

LIA Ops `erd1p4zyy…0crn6`: **1.6038 EGLD**, nonce 1473, shard 2. Positions LP (TROWEGLD, TROUSDC, TROMEX, …) + 10 000 TRO + dust ASH/MEX/USDC. TX récentes : `ESDTTransfer`, `addLiquidity`, `userStake` — **manuel**, pas un flag live-trading.

Deployer `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` : list / bid / upgrade market.

### Smart contracts (codeHash inchangés vs 1–2 oct)

| SC | Suffixe | codeHash | EGLD 7 oct |
|---|---|---|---|
| venue-split | `…2vje2y` | `SRrGio4i…T1owuY=` | 0 |
| nft-marketplace | `…q8txmm` | `8TTszCmN…sZBgFc=` | **0.0175** |
| agents-marketplace | `…gdqwsg` | `tDIcnNMb…CALFUWs=` | 0 |
| nft-staking | `…q4fgtgu` | `hXcRjpcl…fnMuME=` | 0 |
| tro-staking | `…qpe3xf3` | `Jf5ZhzAG…pGq7SA=` | 0 (+ **3 TRO**) |
| tro-governance | `…q9e9euy` | `+9aNhboF…74UOsQ=` | 0 |
| agent-stake-escrow | `…qndvzr3` | `Hs3AClbY…mlSnE=` | 0 |
| treasury-splitter | `…q2nkezv` | `9pB9+UN3…Lnpk8=` | 0 |
| slot-casino | `…qs4g34f` | `UZ0nX6dW…6VJCs=` | **0.5** |

**Ne jamais financer** les placeholders legacy empty (`…8354t`, `…xr8cl`, `…e0ca8`, `…nyztkn`).

### Preuves TX

| fn | status | epoch | note |
|---|---|---|---|
| `buyNft` 0,25 EGLD ASFT-01 | success | 2250 | 1re vente |
| `listNft` | success | 2251 | relist |
| `upgradeContract` market | success | 2252 | codeHash **inchangé** |
| `buyNft` 0,25 retry | **fail** | 2252 | `inactive` |
| `placeBid` 0,01 EGLD | success | 2252 | bid on-chain |
| `spinEgld` 0,001–0,1 | **fail** | 2250–2251 | `wrong number of arguments` / `ESDT expected` |
| `stake` / `unstake` 1 TRO | success | 2248 / 2250 | dust → **3 TRO** on SC |

Marketplace escrow **ASFT-a6273a-01** (BlackArtPass) encore sur le SC. Ce n’est **pas** un 1/1 NFTUDURI.

---

## Build Pages — ce qui était cassé (6 oct) et le correctif (7 oct)

`static.yml` run 1535 (release 0.90.0) **failure** avant même Vite :

1. Chantier 3 a **supprimé** `Agents.tsx` / `MyPacks.tsx` / `Tip.tsx` comme « orphelins ».
2. Les pages canoniques `AgentsPage` / `MyPacksPage` / `TipPage` **réexportaient** encore ces fichiers.
3. CI `Verify Agents = 3 packs only` grep `Agents.tsx` → exit 1.
4. Vite (commit SIWX) : `Could not resolve "../context/PulseContext"` depuis `LiaPage.tsx`.
5. Autres imports morts : `lia/ambient`, `lia/vellumStatus`, `config/modules`.

**Correctif 7 oct (ce push)**

- Restaure `Agents.tsx` · `MyPacks.tsx` · `Tip.tsx` (routes App).
- Shims `PulseContext` · `lia/ambient` · `lia/vellumStatus` · `config/modules`.
- `scStatus` snapshot pour le Dashboard.
- `LINKS.treasuryPolicy`.
- CI Agents plus résilient.
- Demo TCA packs **déjà off en PROD** (`demoPacksAllowed`).

`LIA_LIVE_TRADING` **non** allumé. `VITE_*_CODEHASH_OK` **non** committé. Spin REAL **non** ouvert.

---

## Live vs paper

| Surface | État 7 oct |
|---|---|
| Front Pages | hotfix — rebuild `static.yml` |
| Marketplace List/Buy | SC live · 1 vente ASFT 0,25 · bid 0,01 · ASFT-01 escrowed · buy retry inactive |
| Packs Pulse · Yield · Sentinel | SC agents live · checkout paper / mint « bientôt » |
| Slot | house 0,5 · FUN ouvert · REAL fermé (ABI) |
| Staking TRO | LIVE · **3 TRO** on SC |
| NFT staking / gov / escrow / treasury / venue | codeHash live, balance 0 |
| LIA trading | **paper** (`LIA_LIVE_TRADING=0`) |
| LIA ops | LP + stake manuels depuis le wallet ops |
| TCA / ATC | SAMPLE YouTube · FULL = JWT serveur **ou** packs on-chain · demo localStorage **off en PROD** |
| MX-8004 Identity | First 100 **pas inscrit** |
| Treasury dest | **null** (PR #87) |
| GSN / Contrarian | non branchés live |

---

## Suites logiques (ordre — 7 oct)

1. **Pages vert** — ce push. Vérifier `static.yml` success puis hard-refresh.
2. **Ne pas ouvrir spin REAL** tant que l’ABI `spinEgld` n’accepte pas une mise EGLD (erreurs : *wrong number of arguments* / *ESDT expected*). House 0,5 = plafond.
3. **Marketplace** : bid 0,01 live + listing ASFT inactive au buy. Soit relist propre (3 args ABI : `price`, `royalty_bps`, `royalty_receiver`), soit cancel + 1/1 NFTUDURI. Vérifier indexer avant tout discours « marché ouvert ».
4. **Treasury dest (PR #87) avant** de router 0,0175 EGLD.
5. **MX-8004 / First 100** : inscrire LIA soulbound. Pas un yield.
6. **Ne pas** committer `VITE_*_CODEHASH_OK=1`.
7. **Ne pas** `LIA_LIVE_TRADING=1` tant que Guardian + caps + kill-switch + 1 micro-trade LIA documentés. LP manuel ≠ live trading.
8. **Exchanges** : fenêtre interne 6–11 oct **en cours**. Observer. **Pas** un signal pour lever les caps.
9. **Dependabot majors** (PRs #4–#8, #28–#32) : ne pas merger vite/eslint/vitest pendant la fenêtre live.
10. **Access zero-trust** : `services/access-api` SIWX existe ; brancher `VITE_ACCESS_API_BASE` en prod **après** Pages vert. Sans ça le gate FULL reste client-side (fail-soft SAMPLE).

---

## Veille technologique — 7 oct 2026

### Incident VM 19–24 sept + recovery (rappel)

- 19 sept : anomalie. 20 sept : pause, exploit atomicité VM.
- Hardfork recovery **v2.1.3.0** + **v2.1.5.0**. Comptes attaquant gelés.
- 24–25 sept : mainnet + pont ETH rouverts. Indexer rétabli.
- 28 sept : record 21 798 TPS (Chainspect).
- 30 sept–5 oct : dépôts/retraits **Binance US, Kraken, Bitget** rouverts (MultiversX weekly 5 oct).
- Mainnet **v2.1.7.0** : durcissement VM supplémentaire.
- Fenêtre CEX interne **6–11 oct** encore ouverte. Upbit review ~19–23 oct. **Ne pas lever les caps xArtists.**

### Supernova

- Live 10 Sep ~18:06 UTC, round 32 157 661, epoch 2233.
- 600 ms rounds, 144 000 rounds/epoch, epoch 24 h.
- Probe 7 oct = **J+27**, epoch **2255** (~50 %).
- Builders : timestamps typés (`multiversx-sc` ≥ 0.63).
- 400 ms / ZK natif = **non calendrés**.

### EGLD / DeFi

- Prix API **$4.14** (vs $4.40 le 2 oct, $4.45 le 1er). Mcap **$127.9M**.
- Staked ~14.24M / circ ~30.91M. APR 8.90%.
- xExchange TVL ~$4.6M (weekly 5 oct) — thin-liq. Pas un signal LIA live.
- $TRO : prix API **non nul** (~$0.000093, mcap ~$44) mais **illiquide**. 563 comptes.

### Agents / MX-8004

- ERC-8004 : 537k+ identités (fin sept).
- MX-8004 First 100 xArtists = inscription LIA, **pas faite**.
- Stack agentic MVX : UCP, ACP/AP2, x402, MCP, Relayed v3.

### Infra / RPC

- Public : `https://api.multiversx.com/` (ce probe, HTTP 200).
- Fallbacks : Tatum, node101, NODIT, NOWNodes, SonarX — probe only.

### Produit xArtists (code 7 oct)

- 0.77 → 0.90 depuis le 2 oct : HolderTerminal, shadow sprint, TCA classroom, SIWX/verify-access, DailySignalWidget, Chantier 3.
- Pages **cassé 6 oct**, **corrigé 7 oct**.
- Secrets : aucun PEM/JWT dans git.

---

## Code / vérité 7 oct

- `data/contracts.json` + `apps/frontend/public/data/contracts.json` — SoT adresses + codeHash (reconfirmé 7 oct).
- `runtimeCodehash.ts` — match explorer, cache session v3.
- `scStatus.ts` — `can*` = env flag **ou** runtime match.
- Legacy empty = `never_fund`.
- STATUS.md / ANALYSE **réécrits** (plus de 2 oct / 0.77.0).

Non touché volontairement : live trading LIA, PEM, flags CODEHASH committées, dest treasury, REAL slot public, Dependabot majors.

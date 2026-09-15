# Analyse DApp Complète xArtists — 15 septembre 2026

## Résumé exécutif

xArtists est une dApp **MultiversX mainnet** (lecture) qui combine **galerie NFT / phygital**, **marketplace on-chain (fail-closed)**, **token utilitaire $TRO (cap 500 000)**, **DAO lecture**, et l’agent **LIA v6** (paper-first, Guardian → Brain).

| | |
|---|---|
| **Live Pages** | https://neltud.github.io/xArtists/ |
| **Repo** | https://github.com/Neltud/xArtists |
| **HEAD de travail** | `923c9a0` (13 sept) + ce commit 15 sept |
| **Posture** | **GO_DEMO** — pas un marché live |
| **LIA** | `LIA_LIVE_TRADING=0` (paper) |
| **SC market / agents / staking / gov / minter** | **codeHash null** — List/Buy/Bid bloqués |
| **Supernova mainnet** | **LIVE** depuis le **10 sept 2026 ~18:06 UTC** (epoch 2233) |

Ce n’est **pas** un fonds d’investissement retail. Pas de promesse de performance. Tips ≠ investissement. Wallet **user Connect** ≠ wallet **LIA Ops**.

---

## Verdict produit (15 septembre)

| Surface | État réel | Risque si on ment |
|---------|-----------|-------------------|
| Galerie / Studio / collections | UI live, JSON + API NFT (NFTUDURI 152, TRO SFT 37, MAS 27…) | Faible |
| Marketplace List/Buy/Bid | **Fermé** jusqu’à codeHash | Critique — UI fail-closed |
| Agents packs on-chain | **Non déployé** (Pulse/Yield/Sentinel = catalog) | Critique |
| NFT staking / TRO gov / minter | Adresses placeholder, **empty** | Moyen |
| Wallet connect | Connect + lecture ESDT ; WC QR incomplet | Moyen |
| LIA board / compounding paper | Paper + JSON publish | Moyen — badge PAPER obligatoire |
| DAO | Read-first | Moyen |
| Treasury splitter | Code prêt, dest wallets **null** | Bloquant deploy fees |
| Bridge BTC / RWA escrow | EXPERIMENTAL — no user funds | Interdit live |
| ContrarianBrain / GSN | Labels only — **pas** branchés sur l’exécuteur | Moyen si advertised |
| THE PULSE | Strip démo Home | Faible |

**Source of truth UI :** `apps/frontend` (Vite + React 18 + TS + Tailwind + sdk-dapp **v3**).  
`src/` = dette legacy.

---

## Mesures on-chain — 15 septembre 2026 ~04:33 UTC

### MultiversX `/stats`

| | Mainnet | Devnet |
|---|---------|--------|
| `refreshRate` | **600 ms** (était 6 000 ms le 28 août) | **600 ms** |
| epoch | **2237** | (rounds 10 971 / 24 000) |
| roundsPerEpoch | **144 000** (était 14 400) | 24 000 |
| roundsPassed | 63 109 | 10 971 |
| shards | 3 | 3 |
| accounts | **9 261 197** | **2 130 584** |
| transactions | **627 639 297** | **68 661 390** |
| blocks | 131 054 007 | 75 483 256 |

**Supernova J+5.** Activation epoch **2233**, round **32 157 661**, ~18:06 UTC le 10 sept. Epoch length 24 h inchangée. Finalité moyenne rapportée ~170 ms.

Fix rewards epoch accounting : activation flag **2238**, prévu **15 sept ~18:05 UTC**.

### Economics mainnet (`/economics`)

| Item | Valeur | vs 28 août |
|------|--------|------------|
| EGLD price | **$4.15** | $3.43 |
| Market cap | **$127.8 M** | $105.2 M |
| Circulating / total | 30 788 807 | 30 662 442 |
| Staked | **14 323 919** | 14 549 997 |
| APR | 8.82 % (base 10.73 % / top-up 6.41 %) | 8.7 % |

### xExchange (somme `totalValue` top 20 `/mex/pairs`)

| | |
|---|---|
| TVL mesuré (top 20) | **~$1.90 M** |
| #1 EGLDUSDC | ~$1.66 M |
| #2 ITHWEGLD | ~$0.08 M |
| #3 ZPAYWEGLD | ~$0.07 M |

Le chiffre 28 août (~$2.19 M top 50) n’est pas comparable 1:1 (échantillon). On publie la somme API du jour.

### $TRO-94c925

| | |
|---|---|
| Supply / cap produit | **476 224 / 500 000** |
| Comptes | **563** |
| Tx | 2 787 |
| Prix API | **0** (pas de pair liquide indexée) |

### Comptes produit (codeHash)

| Compte | codeHash | balance | Verdict |
|--------|----------|---------|---------|
| Marketplace `…j8354t` | **null** | 0 | NOT_DEPLOYED |
| NFT staking `…xr8cl` | **null** | 0 | NOT_DEPLOYED |
| TRO governance `…e0ca8` | **null** | 0 | NOT_DEPLOYED |
| NFT minter `…nyztkn` | **null** | 0 | NOT_DEPLOYED |
| agents_marketplace | **null** | — | NOT_DEPLOYED |
| LIA Ops `erd1p4zyy…0crn6` | EOA | **0.093 EGLD** · nonce **1468** | insuffisant gros deploy |

`canListBuyNft()` / `canBuyAgent()` restent fail-closed.

### Collections (probe 15 sept)

| ID | Nom | NFTs | Holders |
|----|-----|------|---------|
| NFTUDURI-2990b6 | ARTCOLLECTION | 152 | 41 |
| TRO-652d6d | TUDURIORIGINAL | 37 | 8 |
| MAS-5189b6 | MAStephany | 27 | 5 |
| HP47X2-b71543 | HAPPYFAMILIES | 19 | 2 |
| ALISTOR-a646bc | TRANSMUNDO | 12 | 2 |
| BGG-2b627c | BorisGaranger | 10 | 3 |
| AGR-9bd53e | AlGorRhythm | 5 | 2 |
| ASFT-a6273a | ArtPassSFT | 1 | 81 |
| XTR-e5072b | xTuduri | 1 | 5 |

---

## Corrections poussées le 15 septembre 2026

1. **Post-Supernova honesty** — README / STATUS / ROADMAP / SOURCE_OF_TRUTH : plus de countdown J-13. Mainnet **600 ms live**.
2. **chainTiming default** — après le 10 sept 18:06 UTC, le default *pre-probe* est supernova (600 ms). `VITE_SUPERNOVA=0` force encore pre. Le probe `/stats.refreshRate` override toujours.
3. **contracts.json** — probe 15 sept, LIA Ops 0.093 EGLD / nonce 1468, SC always empty.
4. **lia_board** — `approx_block_time_sec` 6 → **0.6** (policy toujours « not CEX HFT »).
5. **GSN / ContrarianBrain** — restés non-advertised (P0 13 sept).
6. **Recap + veille** — ce fichier, aligné API du jour.

**Non touché (volontaire) :** Dependabot Vite 8 / ESLint 10 / Vitest 4 — **ne pas merger** sans smoke Pages. `LIA_LIVE_TRADING` reste 0. PEM hors git.

---

## Veille technologique — 15 septembre 2026

### MultiversX / protocole

| Item | Fait |
|------|------|
| **Supernova mainnet** | **LIVE** 10 sept 2026, epoch 2233, round 32 157 661 ~18:06 UTC |
| Block time | **600 ms** (J+5) · rounds/epoch 144 000 |
| Finalité | ~170 ms (comms officielles) |
| Nodes | Upgrade dès le 1er sept ; release v2.0.6.0 activation |
| Follow-ups | v2.0.7.0 + v2.0.8.0 shipped ahead ; **FixEpochChange** epoch **2238** (15 sept ~18:05 UTC) — rewards claim bug |
| Devnet / testnet | 600 ms depuis août |
| Architecture | Consensus découplé de l’exécution ; ordre déterministe conservé ; 3 200+ validateurs |
| EGLD | **$4.15** · mcap **$128 M** · 9.26 M accounts · 628 M tx |
| xExchange | ~$1.9 M TVL (top 20 du jour) |
| Telemetry | https://telemetry.multiversx.com/ · https://supernova.multiversx.com/ |
| Suite protocole | semaines de stabilité 600 ms avant ZK protocol-level / state IO opts |

**Implication xArtists :** polls TX/nonce auto-adaptés. Ne **plus** dire « ne pas flipper VITE_SUPERNOVA avant le 10 sept ». Le default post-date + probe suffisent. Smoke micro-TX ops reste **bloqué** par fund EGLD + SC empty — pas par l’horloge.

### Agents / DeFAI

- Cookbook MultiversX : Warps, UCP/x402, guarded accounts, MX-8004.
- xArtists (LIA + packs Pulse/Yield/Sentinel) est **aligné récit** ; le goulot est **codeHash + micro-TX + EGLD ops**.

### RWA / art tokenisé (11–13 sept 2026)

Sources Crypto Briefing / Odaily / rwa.xyz relais :

| Métrique | Valeur |
|----------|--------|
| RWA on-chain | **~$46.2–46.4 B** (vs $38.7 B le 28 août) |
| US Treasuries | **~$15 B** (plus grosse tranche) |
| Or tokenisé | **$5.1 B** (11 %) — XAUT $2.7 B, PAXG $1.9 B |
| Concentration | 5 assets ≈ 70 % |
| Top chains | Ethereum ~$17.3 B · puis BNB / Solana / Stellar ~$3.3 B |

xArtists reste **art + phygital + royalties + re-évaluation** — différenciant vs T-bills. Tant que l’escrow RWA n’est pas déployé : **catalogue + Studio**, pas « RWA live ».

### Stack 2026 (à surveiller, pas à merger à l’aveugle)

- **sdk-dapp v5+** = standard doc. Front encore **^3**. Dette, pas blocker P0.
- Dependabot Vite 8 / ESLint 10 / Vitest 4 / GH Actions majors : smoke Pages d’abord.
- SpaceCraft / mxpy pour SC Rust.
- PWA + Playwright : ne pas claim E2E green.

---

## Architecture

```
User wallet ──► dApp Pages (SPA Vite) ──► MultiversX mainnet SC
                     ▲                         (seulement si codeHash ≠ null)
                     │ JSON publish
LIA Vellum ──► production_run ──► data/*.json ──► apps/frontend/public/data
                     │
              chain_timing probe (/stats.refreshRate)  → 600 ms
              Guardian FAST  →  Brain SLOW  →  paper (live gated)
```

### Wallets (ne pas mélanger)

| Rôle | Usage | 15 sept |
|------|--------|---------|
| **LIA Ops** | Exécution protocole — **jamais** session user | `erd1p4zyy…0crn6` · 0.093 EGLD · nonce 1468 |
| **User Connect** | Tips / buys | session sdk-dapp |
| **Mission / Reserve / Reward / Ops** | Destinations treasury | **null** |

---

## Sécurité / gates

```bash
PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.security.go_live_gates
```

Attendu pre-deploy : `allow_live_trading=false`, marketplace `codeHash` null, agents null, micro_proofs = 0.

- Guardian : VaR, Kelly, death-spiral, kill-switch.
- Kill reset : **ops-only**.
- `canListBuyNft()` / `canBuyAgent()` : adresse réelle **et** `VITE_*_CODEHASH_OK` **et** ≠ placeholder empty.
- PEM / Pinata JWT / HMAC : **jamais** dans git ni le bundle Pages.

---

## Roadmap — statut 15 septembre

| # | Axe | Statut |
|---|-----|--------|
| 1 | LIA v6 + agents marketplace on-chain | 🟡 SC+ABI+UI ; deploy + signature live restants |
| 2 | Market NFT + LP TRO | 🟡 UI List/Buy ; codeHash null |
| 3 | PWA mobile | 🟢 Base |
| 4 | E2E + monitoring | 🟡 Smoke ; suite à étendre |
| 5 | Bridge BTC + RWA | 🟡 Squelette — no user funds |
| 6 | Docs / Docker / OpenAPI | 🟢 Base |
| 7 | Supernova | 🟢 **Mainnet 600 ms live J+5** · auto-detect + default post-date |

### P0 (ordre strict)

1. Créer wallets Mission + Reserve + Reward + Ops → `contracts.json` + TREASURY_POLICY  
2. **Fund LIA Ops EGLD** (0.093 = trop juste pour deploy + micro-TX)  
3. Deploy nft-marketplace + agents-marketplace (`FEE_BPS=300`) → **codeHash verify**  
4. `post_deploy` + micro-TX user + rebuild Pages (`VITE_*_CODEHASH_OK=1` **seulement** si hash ≠ null)  
5. Deploy treasury-splitter → claimFees 40 / 30 / 20 / 10  
6. Paper stable → seulement alors `LIA_LIVE_TRADING=1` micro-size  
7. Observer fix epoch 2238 (rewards) ; polls déjà 600 ms

---

## Lacunes connues (honnêtes)

- Burn $TRO on-chain à chaque vente NFT : notices UI, SC `tro-burn` non déployé.
- Achat multi-currency natif (EGLD/USDC/TRO) : liens + notices, pas le buy SC.
- WalletConnect QR complet : Web Wallet recommandé ; deep link xPortal.
- sdk-dapp v3 vs v5 doc : dette, pas un blocker P0.
- Dual tree `src/` vs `apps/frontend`.
- Dependabot Vite 8 / ESLint 10 / Vitest 4 : **ne pas merger** sans smoke.
- EGLD LIA Ops bas.
- `oracle_prices.json` : EGLD/TRO encore stub `usd: null` (USDC = 1.0).
- ContrarianBrain / GSN : ne pas advertiser.

---

**Statut final 15 septembre 2026 :** GO_DEMO. Supernova **live**. SC product **empty**. Paper LIA. Docs + chainTiming alignés sur le probe du jour.  
Prêt pour **ops P0 (wallets + fund EGLD + deploy SC)** — pas pour claims « market live ».

*Auteur : Neltud (via Grok) — 15 septembre 2026*

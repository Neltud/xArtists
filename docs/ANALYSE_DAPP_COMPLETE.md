# Analyse DApp Complète xArtists — 17 septembre 2026

## Résumé exécutif

xArtists est une dApp **MultiversX mainnet** (lecture) qui combine **galerie NFT / phygital**, **marketplace on-chain (fail-closed)**, **token utilitaire $TRO (cap 500 000)**, **DAO lecture**, et l’agent **LIA v6** (paper-first, Guardian → Brain).

| | |
|---|---|
| **Live Pages** | https://neltud.github.io/xArtists/ |
| **Repo** | https://github.com/Neltud/xArtists |
| **HEAD de travail** | `79b9991` (release 0.32.0, 15 sept) + ce sprint 17 sept |
| **Posture** | **GO_DEMO** — pas un marché live |
| **LIA** | `LIA_LIVE_TRADING=0` (paper) |
| **SC market / agents / staking / gov / minter** | **codeHash null** — List/Buy/Bid bloqués |
| **Supernova mainnet** | **LIVE** depuis le **10 sept 2026 ~18:06 UTC** (epoch 2233) |

Ce n’est **pas** un fonds d’investissement retail. Pas de promesse de performance. Tips ≠ investissement. Wallet **user Connect** ≠ wallet **LIA Ops**.

---

## Verdict produit (17 septembre)

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
| **Démo GO walkthrough** | Session paper locale (réserve / packs / journal) — 0 tx | Faible si badge PAPER |

**Source of truth UI :** `apps/frontend` (Vite + React 18 + TS + Tailwind + sdk-dapp **v3**).  
`src/` = dette legacy.

---

## Mesures on-chain — 17 septembre 2026 ~04:35 UTC

### MultiversX `/stats`

| | Mainnet (17 sept) | vs 15 sept |
|---|---|---|
| `refreshRate` | **600 ms** | identique |
| epoch | **2239** | 2237 (J+5 → **J+6**) |
| roundsPerEpoch | **144 000** | identique |
| roundsPassed | 63 212 | 63 109 |
| shards | 3 | 3 |
| accounts | **9 262 137** | 9 261 197 |
| transactions | **628 129 736** | 627 639 297 |
| blocks | 132 202 741 | 131 054 007 |

**Supernova J+6.** Activation epoch **2233**, round **32 157 661**, ~18:06 UTC le 10 sept. Epoch length 24 h inchangée. Finalité moyenne rapportée ~170 ms.

**FixEpochChange / rewards claim** visé epoch **2238** (~15 sept 18:05 UTC) : **passé**. Epoch courant 2239. Nodes **v2.0.9.0** (14 sept) — claim rewards bugfix.

### Economics mainnet (`/economics`)

| Item | 17 sept | 15 sept |
|------|---------|---------|
| EGLD price | **$3.85** | $4.15 |
| Market cap | **$118.6 M** | $127.8 M |
| Circulating / total | 30 802 852 | 30 788 807 |
| Staked | **14 322 584** | 14 323 919 |
| APR | 8.83 % (base 10.73 % / top-up 6.41 %) | 8.82 % |

Prix EGLD **−7.2 %** en 48 h. Ne pas figer un “ATH post-Supernova”.

### xExchange (somme `totalValue` top paires `/mex/pairs`)

| | 17 sept |
|---|---|
| TVL mesuré (échantillon top) | **~$1.69 M** |
| #1 WEGLD/USDC | ~$1.60 M |
| #2 RIDE/WEGLD | ~$0.018 M |
| #11 ZPAY/WEGLD | ~$0.062 M |

Cohérent avec le relâchement TVL observé le 15 (~$1.90 M top 20). On publie la somme API du jour, pas un chiffre marketing.

### $TRO-94c925

| | 17 sept |
|---|---|
| Supply / cap produit | **476 224 / 500 000** |
| Comptes | **563** |
| Tx | 2 787 |
| Prix API | **0** (pas de pair liquide indexée) |
| `totalLiquidity` API | **~$0.46** |
| Volume 24 h API | **~$0.01** |
| Top holder | LIA Ops · **100 000 TRO** |

### Comptes produit (codeHash)

| Compte | codeHash | balance | Verdict |
|--------|----------|---------|---------|
| Marketplace `…j8354t` | **null** | 0 | NOT_DEPLOYED |
| NFT staking `…xr8cl` | **null** | 0 | NOT_DEPLOYED |
| TRO governance `…e0ca8` | **null** | 0 | NOT_DEPLOYED |
| NFT minter `…nyztkn` | **null** | 0 | NOT_DEPLOYED |
| agents_marketplace | **null** | — | NOT_DEPLOYED |
| LIA Ops `erd1p4zyy…0crn6` | EOA | **0.093 EGLD** · nonce **1468** | **aucun mouvement depuis le 15 sept** · insuffisant gros deploy |

`canListBuyNft()` / `canBuyAgent()` restent fail-closed.

### Collections (probe 17 sept — inchangé vs 15)

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

LIA Ops détient **9 NFT**.

---

## Corrections poussées le 17 septembre 2026

1. **Probe J+6** — epoch 2239, EGLD $3.85, LIA Ops toujours 0.093 / nonce 1468, SC always empty.
2. **Post-FixEpochChange honesty** — epoch 2238 passé ; rewards claim bugfix v2.0.9.0 noté, sans claim “staking xArtists live”.
3. **contracts.json / lia_board / SOURCE_OF_TRUTH / STATUS / README** alignés sur le probe du jour.
4. **Démo totale walkthrough** — session paper (réserve / packs / tip / journal) clairement badgée, 0 tx, fail-closed List/Buy.
5. **SoftStatus** — epoch courant + J+6, pas un countdown.
6. **Veille** — RWA.xyz 17 sept ~$38.1 B distributed ; relais presse 15 sept $46.7 B (méthodo large). xArtists ≠ T-bills.

**Non touché (volontaire) :** Dependabot Vite 8 / ESLint 10 / Vitest 4 / GH Actions majors — **ne pas merger** sans smoke Pages. `LIA_LIVE_TRADING` reste 0. PEM hors git. Branche `feat/sdk-dapp-v5` reste hors main.

---

## Veille technologique — 17 septembre 2026

### MultiversX / protocole

| Item | Fait |
|------|------|
| **Supernova mainnet** | **LIVE** 10 sept 2026, epoch 2233, round 32 157 661 ~18:06 UTC |
| Block time | **600 ms** (J+6) · rounds/epoch 144 000 |
| Finalité | ~170 ms (comms officielles) |
| Nodes | v2.0.6.0 activation · **v2.0.9.0** 14 sept (rewards claim) |
| Follow-ups | v2.0.7 / v2.0.8 shipped ahead ; FixEpochChange **2238 done** |
| Devnet / testnet | 600 ms depuis août |
| Architecture | Consensus découplé de l’exécution ; ordre déterministe ; 3 200+ validateurs |
| EGLD | **$3.85** · mcap **$119 M** · 9.26 M accounts · 628 M tx |
| xExchange | ~$1.69 M TVL (échantillon du jour) |
| Telemetry | https://telemetry.multiversx.com/ · https://supernova.multiversx.com/ |
| Suite protocole | semaines de stabilité 600 ms avant ZK protocol-level / state IO opts |

**Implication xArtists :** polls TX/nonce déjà 600 ms. Le goulot n’est **plus** l’horloge — c’est **EGLD ops + SC empty**.

### Agents / DeFAI

- Cookbook MultiversX : Warps, UCP/x402, guarded accounts, MX-8004.
- xArtists (LIA + packs Pulse/Yield/Sentinel) est **aligné récit** ; le goulot est **codeHash + micro-TX + EGLD ops**.

### RWA / art tokenisé (15–17 sept 2026)

| Source | Métrique | Valeur |
|--------|----------|--------|
| RWA.xyz 17 sept | Distributed asset value | **~$38.1 B** (−1.1 % / 30j) |
| RWA.xyz 17 sept | Represented | ~$367 B (hors scope “on-chain float”) |
| news.bitcoin.com 15 sept | Tokenized RWAs (méthodo large) | **$46.7 B** |
| Castle / Cryptopolitan 15 sept | US Treasuries | **~$15.9 B** |
| Relais 15 sept | Or tokenisé | **$5.1 B** (XAUT $2.7 B, PAXG $1.9 B) |
| RWA.xyz 17 sept | Ethereum distributed | ~$17–19.6 B |
| RWA.xyz 17 sept | Holders distributed | **~4.43 M** |

Deux chiffres circulent ($38 B vs $46 B) selon inclusion crédit / gold / stocks. On cite **les deux** et on ne mélange pas. xArtists reste **art + phygital + royalties + re-évaluation** — différenciant vs T-bills. Tant que l’escrow RWA n’est pas déployé : **catalogue + Studio**, pas « RWA live ».

### Stack 2026 (à surveiller, pas à merger à l’aveugle)

- **sdk-dapp v5+** = standard doc. Front encore **^3**. Branche `feat/sdk-dapp-v5` existe — dette, pas blocker P0.
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

| Rôle | Usage | 17 sept |
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
- Session paper de la démo = localStorage, **zéro clé**.

---

## Roadmap — statut 17 septembre

| # | Axe | Statut |
|---|-----|--------|
| 1 | LIA v6 + agents marketplace on-chain | 🟡 SC+ABI+UI ; deploy + signature live restants |
| 2 | Market NFT + LP TRO | 🟡 UI List/Buy ; codeHash null |
| 3 | PWA mobile | 🟢 Base |
| 4 | E2E + monitoring | 🟡 Smoke ; suite à étendre |
| 5 | Bridge BTC + RWA | 🟡 Squelette — no user funds |
| 6 | Docs / Docker / OpenAPI | 🟢 Base |
| 7 | Supernova | 🟢 **Mainnet 600 ms live J+6** · FixEpochChange passé |

### P0 (ordre strict) — inchangé, toujours bloquant

1. Créer wallets Mission + Reserve + Reward + Ops → `contracts.json` + TREASURY_POLICY  
2. **Fund LIA Ops EGLD** (0.093 = trop juste pour deploy + micro-TX) — **aucun inbound 48 h**  
3. Deploy nft-marketplace + agents-marketplace (`FEE_BPS=300`) → **codeHash verify**  
4. `post_deploy` + micro-TX user + rebuild Pages (`VITE_*_CODEHASH_OK=1` **seulement** si hash ≠ null)  
5. Deploy treasury-splitter → claimFees 40 / 30 / 20 / 10  
6. Paper stable → seulement alors `LIA_LIVE_TRADING=1` micro-size  
7. Observer rewards post-2238 ; polls déjà 600 ms

### Livré ce sprint (P1.demo)

- Recap + veille 17 sept
- Probe JSON
- Démo walkthrough paper (galerie → pièce → réserve → packs → wallet journal)
- SoftStatus epoch 2239

---

## Lacunes connues (honnêtes)

- Burn $TRO on-chain à chaque vente NFT : notices UI, SC `tro-burn` non déployé.
- Achat multi-currency natif (EGLD/USDC/TRO) : liens + notices, pas le buy SC.
- WalletConnect QR complet : Web Wallet recommandé ; deep link xPortal.
- sdk-dapp v3 vs v5 doc : dette, pas un blocker P0.
- Dual tree `src/` vs `apps/frontend`.
- Dependabot Vite 8 / ESLint 10 / Vitest 4 : **ne pas merger** sans smoke.
- EGLD LIA Ops bas **et stagnant** (nonce 1468).
- `oracle_prices.json` : EGLD/TRO encore stub `usd: null` (USDC = 1.0).
- ContrarianBrain / GSN : ne pas advertiser.

---

**Statut final 17 septembre 2026 :** GO_DEMO. Supernova **live J+6**. SC product **empty**. Paper LIA. Ops **idle** (0.093 EGLD / n1468).  
Prêt pour **ops P0 (wallets + fund EGLD + deploy SC)** — pas pour claims « market live ».

*Auteur : Neltud (via Grok) — 17 septembre 2026*

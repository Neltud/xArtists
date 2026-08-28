# Analyse DApp Complète xArtists — 28 août 2026

## Résumé exécutif

xArtists est une dApp **MultiversX mainnet** qui combine **galerie NFT / phygital (RWA art)**, **marketplace on-chain (fail-closed)**, **token utilitaire $TRO (cap 500 000)**, **DAO**, et l’agent **LIA v6** (paper-first, Guardian → Brain).

| | |
|---|---|
| **Live** | https://neltud.github.io/xArtists/ |
| **Repo** | https://github.com/Neltud/xArtists |
| **HEAD mesuré** | `a070904` (SPA 27 août 18:55 UTC) + ce commit 28 août |
| **Posture** | Private / pre-mainnet — **pas un marché live** |
| **LIA** | `LIA_LIVE_TRADING=0` (paper) |
| **SC market / agents / staking / gov / minter** | **codeHash null** — List/Buy/Bid bloqués |
| **Code** | Corrigé et poussé **28 août 2026** (honesty UI + registry SC + recap) |

Ce n’est **pas** un fonds d’investissement retail. Pas de promesse de performance. Tips ≠ investissement. Wallet **user Connect** ≠ wallet **LIA Ops**.

---

## Verdict produit (28 août)

| Surface | État réel | Risque si on ment |
|---------|-----------|-------------------|
| Galerie / Studio / collections | UI live, données JSON + API NFT | Faible |
| Marketplace List/Buy/Bid | **Fermé** jusqu’à codeHash | Critique — UI fail-closed |
| Agents packs on-chain | **Non déployé** | Critique |
| NFT staking / TRO gov / minter | Adresses placeholder, **empty** | Moyen — registry désormais explicite |
| Wallet connect (Web / xPortal / DeFi) | Connect + lecture ESDT | Moyen (WC QR incomplet) |
| LIA board / compounding paper | Paper + JSON publish | Moyen — badge PAPER obligatoire |
| DAO | Read-first | Moyen |
| Treasury splitter | Code prêt, wallets Mission/Reserve/Reward/Ops **null** | Bloquant deploy fees |
| Bridge BTC | EXPERIMENTAL — no user funds | Interdit live |

**Source of truth UI :** `apps/frontend` (Vite + React 18 + TS + Tailwind + sdk-dapp **v3**).  
`src/` = dette legacy. `docs/index.html` **doit** être la SPA Vite (`#root`), jamais le monolithe Tailwind CDN.

**Pages (mesuré 28 août ~04:33 UTC) :** HTTP 200 · `index.html` ≡ `404.html` → `index-BHdtwICv.js` · pas de `cdn.tailwindcss.com` · last-modified 27 août 18:55 UTC. Le drift 404 de l’audit 27 août est **clos** en git et sur le CDN.

---

## Mesures on-chain — 28 août 2026 ~04:33 UTC

### MultiversX `/stats`

| | Mainnet | Devnet |
|---|---------|--------|
| `refreshRate` | **6000 ms** | **600 ms** |
| epoch | **2219** | **6484** |
| roundsPerEpoch | 14 400 | 24 000 |
| roundsPassed | 6 510 | 10 923 |
| shards | 3 | 3 |
| accounts (`/stats`) | **9 248 633** | **2 403** |
| transactions | **623 425 278** | **30 382 049** |
| blocks | 127 731 106 | 66 131 498 |
| scResults | 423 223 678 | 13 765 891 |

**Note Devnet accounts :** le 26 août le recap citait ~2,06 M accounts. Le 28 août `/stats.accounts` Devnet = **2 403**. On **rapporte le chiffre API**, sans inventer. Possible reset d’index / changement de métrique post-Supernova Devnet — à re-sonder.

### Economics mainnet (`/economics`)

| Item | Valeur |
|------|--------|
| EGLD price | **$3.43** |
| Market cap | **$105.17 M** |
| Circulating / total | 30 662 442 |
| Staked | **14 549 997** |
| APR | 8.7 % (base 10.66 % / top-up 6.29 %) |

### xExchange (somme `totalValue` des 50 paires `/mex/pairs`)

| | |
|---|---|
| TVL mesuré (top 50) | **~$2.19 M** |
| #1 EGLDUSDC-594e5e | ~$1.50 M |
| #2 EGLDMEX-0be9e5 | ~$0.35 M |
| #3 ASHWEGLD-38545c | ~$0.07 M |

Le chiffre weekly du 24–26 août (~$3.68 M) n’est **pas** re-confirmé ici ; on publie la somme API du jour.

### Comptes produit (codeHash)

| Compte | codeHash | balance | Verdict |
|--------|----------|---------|---------|
| Marketplace `…j8354t` | **null** | 0 | NOT_DEPLOYED |
| NFT staking `…xr8cl` | **null** | 0 | NOT_DEPLOYED |
| TRO governance `…e0ca8` | **null** | 0 | NOT_DEPLOYED |
| NFT minter `…nyztkn` | **null** | 0 | NOT_DEPLOYED |
| agents_marketplace | **null** (jamais déployé) | — | NOT_DEPLOYED |
| LIA Ops `erd1p4zyy…0crn6` | EOA | **0.069 EGLD** · nonce **1437** | insuffisant gros deploy |

`canListBuyNft()` / `canBuyAgent()` restent fail-closed : adresse réelle **et** `VITE_*_CODEHASH_OK` **et** ≠ placeholder empty.

---

## Corrections poussées le 28 août 2026

1. **Honesty Marketplace** — le badge « live-dot · MultiversX Mainnet » laissait croire à un market live. Désormais : *Mainnet · lecture · SC non déployé* tant que `canListBuyNft()` est false.
2. **Honesty Galerie** — libellé *lecture MultiversX mainnet* (pas un signal « live commerce »).
3. **Bandeau Private** — countdown **upgrade nodes (1er sept.)** + **activation Supernova (10 sept.)** calculés en UTC (J-4 / J-13 au 28 août).
4. **Registry SC** — `data/contracts.json` (+ miroirs `docs/data` et `public/data`) : staking / governance / minter **explicitement empty** (probe API 28 août). Wallets Reward/Ops ajoutés comme `null`.
5. **DataHealthStrip** — `compounding_echelons.json` + `lia_signal_fusion.json` copiés dans `apps/frontend/public/data` (manquaient en local Vite ; déjà 200 sur Pages via `docs/data`).
6. **Docs** — recap + veille 28 août, STATUS, ROADMAP countdown J-13 / J-4.

**Non touché (volontaire) :** Dependabot Vite 8 / ESLint 10 / Vitest 4 / GH Actions majors — **ne pas merger** sans smoke. `VITE_SUPERNOVA` **non** forcé sur Pages. `LIA_LIVE_TRADING` reste 0.

---

## Veille technologique — 28 août 2026

### MultiversX / protocole

| Item | Fait (28 août) |
|------|----------------|
| Mainnet | **v1.11.11.0** (10 août, miniblock checks). Précédent **v1.11.10.0** (6 août, epoch 2198). Stable **J+18 / J+22**. Aucune release protocole 27–28 août identifiée. |
| Block time mainnet | `refreshRate` **6000 ms** (epoch **2219**) |
| **Supernova Devnet** | **LIVE** depuis le **20 août** — `refreshRate` **600 ms** (**J+8**). Epoch 6484, 24k rounds/epoch. |
| Mainnet upgrade nodes | **1er septembre 2026** (**J-4**) |
| Mainnet activation | **10 septembre 2026** (**J-13**) |
| Roadmap officielle | Supernova sub-second **97.7 %** |
| API | v1.21.0 (19 août) — pagination `searchAfter`, WebSocket, NFT media/thumbs |
| Telemetry | Dashboard de retour depuis le 25 août — https://telemetry.multiversx.com/ |
| Momentum | Épisode **27 août 16:00 UTC** — **passé**. Dernier brief architectes avant upgrade nodes. |
| Cointelegraph (26 août) | Découplage consensus / exécution, finality visée **< 250 ms**, blocks **600 ms**, réseau shardé. Relais @MultiversX. |
| Note protocole (24 août) | *« Every timeout and deadline you tuned to the six second clock is about to be off by 10x. »* — adresses, ABIs, SDK **inchangés** |
| Stats écosystème (28 août, API) | 9.25 M accounts · 623.4 M tx · 14.55 M staked · EGLD **$3.43** · mcap **$105 M** |

**Implication xArtists :** polls TX/nonce auto-adaptés. Ne **pas** flipper `VITE_SUPERNOVA=1` sur le build Pages **avant** le 10 sept. (mainnet encore à 6 s). Devnet tests : `CHAIN_SUPERNOVA=1` ou `VITE_MVX_API=https://devnet-api.multiversx.com`.

**J-4 (1er sept.) :** les validateurs upgradent les nœuds. Surveiller halts dépôts CEX (précédent : Upbit le 6 août pour v1.11.10). Pas d’action code xArtists ce jour-là si l’auto-detect reste en place.

**J-13 (10 sept.) :** activation. Le probe `/stats.refreshRate` doit passer 6000 → 600 **sans rebuild**. Smoke micro-TX le jour J.

### Agents / DeFAI

- Cookbook MultiversX : projets agents-ready (Warps, UCP/x402, guarded accounts).
- Narrative : *What an agent needs to transact* + MX-8004 identité/réputation (devnet).
- xArtists (LIA + GreenSmoke + Agents Marketplace) est **aligné** ; le goulot n’est plus le récit, c’est le **codeHash + micro-TX + EGLD ops**.

### RWA / art tokenisé (28 août)

Source [rwa.xyz](https://app.rwa.xyz/) au **28 août 2026** :

| Métrique | Valeur |
|----------|--------|
| Distributed asset value (ex-stables) | **$38.69 B** (+3.04 % / 30j) |
| Represented asset value | **$366.68 B** (−1.01 % / 30j) |
| Holders RWA | **2.95 M** (+105 % / 30j) |
| Stablecoins (hors RWA) | **$303.04 B** |
| Top networks (distributed) | Ethereum ~$17.5 B · BNB ~$5.8 B · Solana ~$4.0 B · Stellar ~$3.3 B · Avalanche ~$1.7 B |
| Drivers | Private credit + Treasuries ; equities tokenisées (Nasdaq, Robinhood Chain volume record ~$85 M/j le 27 août) |
| Liquidité | Paradoxe inchangé : beaucoup de mint/redeem, peu de secondary |

Vs 26 août : distributed **$38.30 B → $38.69 B**. xArtists reste **art + phygital + royalties + re-évaluation IA** — différenciant vs Treasuries. Tant que l’escrow RWA n’est pas déployé : **catalogue + Studio**, pas « RWA live ».

### Stack 2026 (à surveiller, pas à merger à l’aveugle)

PRs Dependabot **ouvertes** (ne pas merger sans smoke Pages) :

| PR | Objet |
|----|--------|
| [#37](https://github.com/Neltud/xArtists/pull/37) | release-please **0.16.0** |
| [#32](https://github.com/Neltud/xArtists/pull/32) | ESLint 10.8.0 |
| [#31](https://github.com/Neltud/xArtists/pull/31) | Vite **8.1.5** |
| [#30](https://github.com/Neltud/xArtists/pull/30) | Vitest 4.1.10 |
| [#29](https://github.com/Neltud/xArtists/pull/29) | prettier 3.9.6 |
| [#28](https://github.com/Neltud/xArtists/pull/28) | plugin-react 6.0.4 |
| #4–#8 | actions checkout/setup-node/cache/pages v5–v6 |
| #3 | Railway stale |

- **sdk-dapp v5+** = standard doc (fév. 2026). Front encore **sdk-dapp ^3**. Dette, pas blocker P0.
- SpaceCraft / mxpy pour SC Rust.
- PWA + Playwright smoke déjà en place.

---

## Architecture

```
User wallet ──► dApp Pages (SPA Vite) ──► MultiversX mainnet SC
                     ▲                         (seulement si codeHash ≠ null)
                     │ JSON publish
LIA Vellum ──► production_run ──► data/*.json ──► apps/frontend/public/data
                     │
              chain_timing probe (/stats.refreshRate)
              Guardian FAST  →  Brain SLOW  →  paper (live gated)
```

### Wallets (ne pas mélanger)

| Rôle | Usage | 28 août |
|------|--------|---------|
| **LIA Ops** | Exécution protocole — **jamais** session user | `erd1p4zyy…0crn6` · 0.069 EGLD |
| **User Connect** | Tips / buys | session sdk-dapp |
| **Mission / Reserve / Reward / Ops** | Destinations treasury | **null** — à créer avant splitter |

### Couches

| Couche | Tech | Rôle |
|--------|------|------|
| SC Rust | nft-marketplace, agents-marketplace, treasury-splitter, tro-burn, rwa-escrow, nft-staking, tro-staking, btc-bridge, soul-zk | Market, agents, fees, burn, RWA, staking |
| Frontend | `apps/frontend` React 18 + Vite 5 + Tailwind + sdk-dapp v3 | 20+ routes, PWA, fail-closed TX |
| LIA | package `lia/` (Vellum, Guardian, oracles, compounding 10 col) | Paper cycle 3–5 min |
| Data | `data/*.json` miroir `public/data` + `docs/data` | Board, collections, contracts |
| CI | GitHub Actions → GH Pages (`docs/` = SPA + markdown) | Deploy exclusive + garde 404 ≡ index |

---

## Sécurité / gates

```bash
PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.security.go_live_gates
```

Attendu pre-deploy : `allow_live_trading=false`, marketplace `codeHash` null, agents null, micro_proofs = 0.

- Guardian : VaR, Kelly, death-spiral, kill-switch.
- Kill reset : **ops-only**, jamais auto (`docs/KILL_SWITCH_RESET.md`).
- `canListBuyNft()` / `canBuyAgent()` : adresse réelle **et** `VITE_*_CODEHASH_OK` **et** ≠ placeholder empty.
- Audit pack : [`docs/AUDIT_EXTERNAL_FULL.txt`](AUDIT_EXTERNAL_FULL.txt).
- PEM / Pinata JWT / HMAC : **jamais** dans git ni le bundle Pages.

---

## Roadmap V1 — statut 28 août

| # | Axe | Statut |
|---|-----|--------|
| 1 | LIA v6 + agents marketplace on-chain | 🟡 SC+ABI+UI ; deploy + signature live restants |
| 2 | Market NFT + LP TRO | 🟡 UI List/Buy ; codeHash null |
| 3 | PWA mobile | 🟢 Base |
| 4 | E2E + monitoring | 🟡 Smoke ; suite à étendre |
| 5 | Bridge BTC + RWA | 🟡 Squelette — no user funds |
| 6 | Docs / Docker / OpenAPI | 🟢 Base |
| 7 | Supernova | 🟡 **Auto-detect livré** ; nodes **J-4** · activation **J-13** |

### P0 (ordre strict — inchangé)

1. Créer wallets Mission + Reserve + Reward + Ops → `contracts.json` + TREASURY_POLICY  
2. **Fund LIA Ops EGLD** (0.069 = trop juste pour deploy + micro-TX)  
3. Deploy nft-marketplace + agents-marketplace (`FEE_BPS=300`) → **codeHash verify**  
4. `post_deploy` + micro-TX user + rebuild Pages (`VITE_*_CODEHASH_OK=1` **seulement** si hash ≠ null)  
5. Deploy treasury-splitter → claimFees 40 / 30 / 20 / 10  
6. Paper stable → seulement alors `LIA_LIVE_TRADING=1` micro-size  
7. Observer Devnet ; le 10 sept. le probe bascule tout seul (ne pas forcer le flag trop tôt)

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

Détail : [`docs/LACUNES_PRODUIT.md`](LACUNES_PRODUIT.md) · [`docs/GAP_REVIEW_FULL_2026-08-25.md`](GAP_REVIEW_FULL_2026-08-25.md) · audit 27 août [`AUDIT_GLOBAL_2026-08-27.md`](AUDIT_GLOBAL_2026-08-27.md)

---

## Data Pages (santé 28 août)

| JSON | HTTP live |
|------|-----------|
| `lia_board` · `lia_v6_status` · `oracle_prices` · `lia_brain_cycle` · `lia_signal_fusion` · `lia_paper_legs` · `compounding_echelons` | **200** |
| `entity_map` · `voyage_agent` · `liquidity_cycle` · `greensmoke_forecasts` · `agents_catalog` · `live_network_snapshot` · `risk_manager_state` · `treasury_wallets` · `contracts` | **200** |
| `live_network.json` / `risk.json` / `lia_v6.json` (anciens noms) | **404** — **non utilisés** par le front actuel |

---

**Statut final 28 août 2026 :** code pleinement corrigé (fail-closed, connect, SPA Pages, 404 ≡ index, Supernova auto-detect, honesty live-dot, registry SC empty). Documenté et poussé.  
Veille : Devnet 600 ms **J+8** · mainnet 6 s · **J-4** upgrade nodes · **J-13** activation · RWA **$38.69 B** · EGLD **$3.43**.  
Prêt pour **ops P0 (wallets + fund EGLD + deploy SC)** — pas pour claims « market live ».

*Auteur : Neltud (via Grok) — 28 août 2026*

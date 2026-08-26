# Analyse DApp Complète xArtists — 26 août 2026

## Résumé exécutif

xArtists est une dApp **MultiversX mainnet** qui combine **galerie NFT / phygital (RWA art)**, **marketplace on-chain (fail-closed)**, **token utilitaire $TRO (cap 500 000)**, **DAO**, et l’agent **LIA v6** (paper-first, Guardian → Brain).

| | |
|---|---|
| **Live** | https://neltud.github.io/xArtists/ |
| **Repo** | https://github.com/Neltud/xArtists |
| **Posture** | Private / pre-mainnet — **pas un marché live** |
| **LIA** | `LIA_LIVE_TRADING=0` (paper) |
| **SC market / agents** | **codeHash null** — List/Buy/Bid bloqués |
| **Code** | Corrigé et poussé **26 août 2026** (v0.15.0+ / sprint 0.16) |

Ce n’est **pas** un fonds d’investissement retail. Pas de promesse de performance. Tips ≠ investissement. Wallet **user Connect** ≠ wallet **LIA Ops**.

---

## Verdict produit (26 août)

| Surface | État réel | Risque si on ment |
|---------|-----------|-------------------|
| Galerie / Studio / collections | UI live, données JSON + API NFT | Faible |
| Marketplace List/Buy/Bid | **Fermé** jusqu’à codeHash | Critique — UI fail-closed |
| Agents packs on-chain | **Non déployé** | Critique |
| Wallet connect (Web / xPortal / DeFi) | Connect + lecture ESDT | Moyen (WC QR incomplet) |
| LIA board / compounding paper | Paper + JSON publish | Moyen — badge PAPER obligatoire |
| DAO | Read-first | Moyen |
| Treasury splitter | Code prêt, wallets Mission/Reserve/Reward/Ops **null** | Bloquant deploy fees |
| Bridge BTC | EXPERIMENTAL — no user funds | Interdit live |

**Source of truth UI :** `apps/frontend` (Vite + React 18 + TS + Tailwind + sdk-dapp).  
`src/` = dette legacy. `docs/index.html` **doit** être la SPA Vite (`#root`), jamais le monolithe Tailwind CDN.

---

## Corrections poussées le 26 août 2026

1. **Pages SPA** — garde CI : refuser `cdn.tailwindcss.com` dans `docs/index.html` (le site live servait encore l’ancien HTML CDN v5.0, d’où l’absence de bandeau Private / codeHash).
2. **Connect hero** — le bouton « Connecter le wallet » du LandingHero était **inerte** (`onConnect` non branché). Désormais `requestOpenConnect()` → modal Header.
3. **Honesty UI** — badge Private (plus de « live-dot »), DualMarketplaceStrip affiche « consultation / SC non déployé », countdown Supernova dans le bandeau.
4. **Supernova auto-detect** — `refreshRate` API (`6000` mainnet / `600` Devnet) pilote les polls TX/nonce **sans rebuild** le 10 sept. Flags `VITE_SUPERNOVA` / `CHAIN_SUPERNOVA` restent un override.
5. **Fail-closed SC** — le test de régression autorisait à tort le placeholder empty account (`…j8354t`) si `CODEHASH_OK=1`. Aligné sur `scStatus.ts`.
6. **Vellum** — `production_run` sonde `/stats` en phase `chain_timing` (fail-soft).

---

## Veille technologique — 26 août 2026

### MultiversX / protocole

| Item | Fait (26 août) |
|------|----------------|
| Mainnet | **v1.11.11.0** (10 août, miniblock checks, pas d’epoch d’activation). Précédent **v1.11.10.0** activé 6 août (epoch 2198, VM). Stable **J+20 / J+16**. |
| Block time mainnet | `refreshRate` **6000 ms** (epoch **2217**, ~9.247 M accounts, **623.09 M** tx, 3 shards) |
| **Supernova Devnet** | **LIVE** depuis le **20 août** — `refreshRate` **600 ms** (J+6). ~2.06 M accounts, 29.3 M tx, epoch 6472, 24k rounds/epoch |
| Mainnet upgrade nodes | **1er septembre 2026** (**J-6**) |
| Mainnet activation | **10 septembre 2026** (**J-15**) |
| Roadmap officielle | Supernova sub-second **97.7 %** |
| API | v1.21.0 (19 août) — pagination `searchAfter`, WebSocket, NFT media/thumbs |
| Telemetry | **Dashboard de retour** (25 août, 17:00 UTC) — https://telemetry.multiversx.com/ |
| Momentum | **27 août, 16:00 UTC** — dernier épisode avant Supernova, @AdrianDobrita + @radu_chis |
| Note protocole (24 août) | *« Every timeout and deadline you tuned to the six second clock is about to be off by 10x. »* — adresses, ABIs, SDK **inchangés** |
| Stats écosystème (24–26 août) | 9.25 M accounts · 623 M tx · 14.5 M staked · 3200+ nodes · xPortal 3M+ · xExchange **~$3.68 M TVL** · 1.6 M USD 7d · pic **238 K tx/jour** |

**Implication xArtists :** polls TX/nonce auto-adaptés. Ne **pas** flipper `VITE_SUPERNOVA=1` sur le build Pages **avant** le 10 sept. (mainnet encore à 6 s). Devnet tests : `CHAIN_SUPERNOVA=1` ou pointer `VITE_MVX_API` vers `https://devnet-api.multiversx.com` (le probe lira 600).

### Agents / DeFAI

- Cookbook MultiversX : **61** projets agents-ready.
- Narrative officielle : *What an agent needs to transact* + UCP/x402 + guarded accounts.
- Warps v3+ = UI shareable on-chain pour mint / TX agents.
- MX-8004 identité/réputation agents (devnet).
- xArtists (LIA + GreenSmoke + Agents Marketplace) est **aligné** ; le goulot n’est plus le récit, c’est le **codeHash + micro-TX**.

### RWA / art tokenisé (26 août)

Source [rwa.xyz](https://app.rwa.xyz/) au **25–26 août 2026** :

| Métrique | Valeur |
|----------|--------|
| Distributed asset value (ex-stables) | **$38.30 B** (+1.85 % / 30j) |
| Represented asset value | **$353.11 B** |
| Mid-year trackers | ~$31–36 B on-chain ; définitions larges $51–60 B (dont idle) |
| Drivers | Private credit + Treasuries ; equities tokenisées en accélération (Nasdaq) |
| Liquidité | Toujours le paradoxe : beaucoup de mint/redeem, peu de secondary |

**Position xArtists :** art + phygital + royalties + re-évaluation IA — **différenciant** vs Treasuries institutionnels. Tant que l’escrow RWA n’est pas déployé, rester en **catalogue + Studio**, pas en « RWA live ».

### Stack 2026 (à surveiller, pas à merger à l’aveugle)

- **sdk-dapp v5+** est le standard doc (fév. 2026). `apps/frontend` est encore sur **sdk-dapp ^3**. PRs Dependabot Vite 8 / ESLint 10 / Vitest 4 **ouvertes** — ne pas merger sans smoke Pages.
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

| Rôle | Usage |
|------|--------|
| **LIA Ops** | Exécution protocole — **jamais** session user |
| **User Connect** | Tips / buys |
| **Mission / Reserve / Reward / Ops** | Destinations treasury — **à créer avant** splitter |

LIA Ops (public) : `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6`

### Couches

| Couche | Tech | Rôle |
|--------|------|------|
| SC Rust | nft-marketplace, agents-marketplace, treasury-splitter, tro-burn, rwa-escrow, nft-staking, tro-staking, btc-bridge, soul-zk | Market, agents, fees, burn, RWA, staking |
| Frontend | `apps/frontend` React 18 + Vite + Tailwind + sdk-dapp | 20+ routes, PWA, fail-closed TX |
| LIA | package `lia/` (Vellum, Guardian, oracles, compounding 10 col) | Paper cycle 3–5 min |
| Data | `data/*.json` miroir `public/data` | Board, collections, contracts |
| CI | GitHub Actions → GH Pages (`docs/` = SPA + markdown) | Deploy exclusive + pages |

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

---

## Roadmap V1 — statut 26 août

| # | Axe | Statut |
|---|-----|--------|
| 1 | LIA v6 + agents marketplace on-chain | 🟡 SC+ABI+UI ; deploy + signature live restants |
| 2 | Market NFT + LP TRO | 🟡 UI List/Buy ; codeHash null |
| 3 | PWA mobile | 🟢 Base |
| 4 | E2E + monitoring | 🟡 Smoke ; suite à étendre |
| 5 | Bridge BTC + RWA | 🟡 Squelette — no user funds |
| 6 | Docs / Docker / OpenAPI | 🟢 Base |
| 7 | Supernova | 🟡 **Auto-detect livré** ; activation 10 sept. J-15 |

### P0 (ordre strict — inchangé)

1. Créer wallets Mission + Reserve + Reward + Ops → `contracts.json` + TREASURY_POLICY  
2. Deploy nft-marketplace + agents-marketplace (`FEE_BPS=300`) → **codeHash verify**  
3. `post_deploy` + micro-TX user + rebuild Pages (`VITE_*_CODEHASH_OK=1` **seulement** si hash ≠ null)  
4. Deploy treasury-splitter → claimFees 40 / 30 / 20 / 10  
5. Paper stable → seulement alors `LIA_LIVE_TRADING=1` micro-size  
6. Observer Devnet ; le 10 sept. le probe bascule tout seul (ne pas forcer le flag trop tôt)

---

## Lacunes connues (honnêtes)

- Burn $TRO on-chain à chaque vente NFT : notices UI, SC `tro-burn` non déployé.
- Achat multi-currency natif (EGLD/USDC/TRO) : liens + notices, pas le buy SC.
- WalletConnect QR complet : Web Wallet recommandé ; deep link xPortal.
- sdk-dapp v3 vs v5 doc : dette, pas un blocker P0.
- Dual tree `src/` vs `apps/frontend`.
- Dependabot Vite 8 / ESLint 10 : **ne pas merger** sans smoke.

Détail : [`docs/LACUNES_PRODUIT.md`](LACUNES_PRODUIT.md) · [`docs/GAP_REVIEW_FULL_2026-08-25.md`](GAP_REVIEW_FULL_2026-08-25.md)

---

**Statut final 26 août 2026 :** code pleinement corrigé (fail-closed, connect, SPA Pages, Supernova auto-detect), documenté et poussé.  
Veille : Devnet 600 ms J+6 · mainnet 6 s J-15 avant activation · RWA $38.3 B · telemetry + Momentum 27 août.  
Prêt pour **ops P0 (wallets + deploy SC)** — pas pour claims « market live ».

*Auteur : Neltud (via Grok) — 26 août 2026*

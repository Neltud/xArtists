# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists  

**Status (2026-09-24): GO_DEMO · paper / pre-SC-deploy · indexer dégradé**  
- Paper LIA by default (`LIA_LIVE_TRADING=0`)  
- Marketplace, agents, staking, gov, minter SC: **not live** (last-known empty / null `codeHash`) until deploy + verify  
- UI fail-closed: no fake “live market” claims without on-chain code  
- Reality Switch (paper vs live chrome) = **chemin**, pas un live allumé — [`docs/REALITY_SWITCH.md`](docs/REALITY_SWITCH.md)  
- **Supernova mainnet LIVE** since 10 Sep 2026 (epoch 2233) — 600 ms rounds · probe epoch **2242** (J+9)  
- **Mainnet recovery hardfork** config **v2.1.3.0** (23 Sep 2026) — `/stats` OK, `/economics` `/accounts` `/tokens` **down**. Do not deploy SC until accounts API is live.  
- **LIA Ops ~2.09 EGLD** last-known (nonce 1468 as of 19 Sep) — accounts unread today; PEM stays off git.  
- **Phase 4 / First 100** : [`docs/MX8004_FIRST100_ALIGNMENT.md`](docs/MX8004_FIRST100_ALIGNMENT.md) (register **after** indexer recovery).

Recap + veille (24 sept) : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md)

---

## What it is

| Layer | Role |
|-------|------|
| **Studio / Gallery** | Create & browse NFT collections (NFTUDURI live via API) |
| **Marketplace** | List / Buy / Bid (after SC deploy + codeHash) |
| **Agents** | Limited LIA sub-agent packs (Pulse · Yield · Sentinel) |
| **LIA** | Autonomous agent (Guardian → Brain → paper/live) |
| **$TRO** | Utility token — max supply product 500 000 |
| **Slot** | Primordial Slot paper bank — RWA jackpot claim locked |

Not a retail investment fund. Tips ≠ investment.

---

## Environment variables

Full reference: **[`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md)**  
Frontend template: [`apps/frontend/.env.example`](apps/frontend/.env.example)

```bash
# Paper ops (Python)
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0

# Front (build) — codeHash flags ONLY after verify
# VITE_MARKETPLACE_CODEHASH_OK=1
# VITE_AGENTS_CODEHASH_OK=1
# Timing: auto from /stats.refreshRate (mainnet 600 ms). Force pre: VITE_SUPERNOVA=0
```

Secrets (PEM, Pinata JWT, HMAC) stay in Vellum / ops vault — **never** in git.

---

## Build steps (summary)

Guide: [`docs/BUILD_STEPS.md`](docs/BUILD_STEPS.md) · SC: [`docs/SC_DEPLOY_COMMANDS.md`](docs/SC_DEPLOY_COMMANDS.md)

```bash
cd apps/frontend && npm ci && npm run build
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m lia.vellum.production_run
./scripts/build_scs_isolated.sh all   # optional
python -m lia.security.go_live_gates
```

Push `main` → GitHub Actions → Pages.

---

## Deploy SC (mainnet only)

**Gate 24 Sep:** wait until `GET https://api.multiversx.com/accounts/{addr}` returns JSON.

```bash
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0 PEM=/secure/mainnet.pem
./scripts/runbook_deploy.sh dry
./scripts/runbook_deploy.sh deploy
./scripts/runbook_deploy.sh verify
python scripts/verify_marketplace_codehash.py
```

LIA Ops last-known funded (~2.09 EGLD as of 19 Sep 2026). Dest treasury wallets still **null**. PEM never in git.

---

## Vellum / LIA

See [`README_LIA.md`](README_LIA.md) and [`docs/AUTONOMOUS_LIA.md`](docs/AUTONOMOUS_LIA.md).

## Docs

| Doc | Role |
|-----|------|
| [ANALYSE_DAPP_COMPLETE.md](docs/ANALYSE_DAPP_COMPLETE.md) | Recap + veille **24 sept** |
| [MX8004_FIRST100_ALIGNMENT.md](docs/MX8004_FIRST100_ALIGNMENT.md) | Phase 4 / First 100 — LIA → MX-8004 |
| [DEMO_WALKTHROUGH.md](docs/DEMO_WALKTHROUGH.md) | Parcours démo `/demo` |
| [GO_LIVE_DEPLOY.md](docs/GO_LIVE_DEPLOY.md) | Deploy SC |
| [REALITY_SWITCH.md](docs/REALITY_SWITCH.md) | Paper → live chrome |
| [PRIMORDIAL_SLOT.md](docs/PRIMORDIAL_SLOT.md) | Slot paper |
| [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | Env |

## License

MIT. No PEM, JWT, or private keys in git — ever.

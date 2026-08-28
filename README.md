# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists  

**Status (2026-08-28): private / pre-mainnet release**  
- Paper LIA by default (`LIA_LIVE_TRADING=0`)  
- Marketplace, agents, staking, gov, minter SC: **not live** (empty / null `codeHash`) until deploy + verify  
- UI fail-closed: no fake “live market” claims without on-chain code  
- Supernova: Devnet 600 ms (J+8) · mainnet node upgrade **1 Sep (J-4)** · activation **10 Sep (J-13)**  

Recap + veille : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md)

---

## What it is

| Layer | Role |
|-------|------|
| **Studio / Gallery** | Create & browse NFT collections |
| **Marketplace** | List / Buy / Bid (after SC deploy + codeHash) |
| **Agents** | Limited LIA sub-agent packs |
| **LIA** | Autonomous agent (Guardian → Brain → paper/live) |
| **$TRO** | Utility token — max supply product 500 000 |

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
# Do NOT set VITE_SUPERNOVA=1 on Pages before 10 Sep 2026
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

```bash
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0 PEM=/secure/mainnet.pem
./scripts/runbook_deploy.sh dry
./scripts/runbook_deploy.sh deploy
./scripts/runbook_deploy.sh verify
python scripts/verify_marketplace_codehash.py
```

---

## Vellum / LIA

```bash
export CHAIN=1 LIA_LIVE_TRADING=0 PYTHONPATH=.
python -m lia.vellum.production_run
```

Map: [`docs/VELLUM_WORKFLOW_MAP.md`](docs/VELLUM_WORKFLOW_MAP.md)

---

## Docs index

| Doc | Purpose |
|-----|--------|
| [ANALYSE_DAPP_COMPLETE.md](docs/ANALYSE_DAPP_COMPLETE.md) | Recap dApp + veille (28 août 2026) |
| [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | **Variables d’environnement** |
| [BUILD_STEPS.md](docs/BUILD_STEPS.md) | Build front / LIA / SC |
| [SC_DEPLOY_COMMANDS.md](docs/SC_DEPLOY_COMMANDS.md) | Commandes deploy SC |
| [STATUS.md](docs/STATUS.md) | Capability matrix |
| [VELLUM_WORKFLOW_MAP.md](docs/VELLUM_WORKFLOW_MAP.md) | Workflows Vellum |

No PEM, JWT, or private keys in git — ever.

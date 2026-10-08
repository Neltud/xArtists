# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists  

**Status (2026-10-08): GO_LIVE SC · LIA paper · slot non payable · listing #2 actif**
- Product SCs: codeHash **inchangés**, re-sondés **8 oct 2026**, epoch **2256**, refreshRate 600
- Market `isPayable=true`. Listing **#1 inactif** (vente 0,25 epoch 2250). Listing **#2 actif** ASFT-a6273a-01 à **0,25 EGLD**, bid **0,01** encore locké. Le front ne devine plus l’id 1
- Market balance **0,0175 EGLD** = fees **0,0075** + bid **0,01**. Fee **300 bps**
- Slot house **0,5000 EGLD**, `isPayable=false`, min bet **0,001**, spin count 0. REAL fermé. Upgrade metadata du **même** contrat, pas un nouveau deploy
- TRO stake **3 TRO**. LIA Ops **1,6038 EGLD**, nonce **1473**, trading **paper**
- EGLD **$4,09** · mcap ~$126,4M · staked 14,25M · APR ~8,89%
- $TRO circ **476 224** · 563 comptes · ~$0,000090
- NFTUDURI **152** / **41** holders
- Treasury dest **null** — ne pas router les frais
- `ci-cd.yml` (wipe docs + deploy vide) **désactivé**. Go-live = `static.yml`
- Legacy empty placeholders must **never** receive funds
- Not a retail investment fund. Tips ≠ investment. User Connect ≠ LIA Ops.

Recap + veille (8 oct) : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md)  
Demo : https://neltud.github.io/xArtists/#/demo · GO_LIVE : https://neltud.github.io/xArtists/#/go-live

---

## What it is

| Layer | Role |
|-------|------|
| **Studio / Gallery** | Create & browse NFT collections (NFTUDURI live via API, 152) |
| **Marketplace** | List / Buy / Bid — listing #2 actif 0,25 EGLD (ne plus acheter l’id #1) |
| **Agents** | Limited LIA sub-agent packs (Pulse · Yield · Sentinel) |
| **LIA** | Autonomous agent (Guardian → Brain → paper until micro-proofs) |
| **$TRO** | Utility token — max supply product 500 000 · circ ~476 224 · API ~$0.000093 |
| **Slot** | Primordial Slot — house 0,5 EGLD, REAL fermé (`isPayable=false`) |

Not a retail investment fund. Tips ≠ investment.

---

## Environment variables

Full reference: **[`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md)**  
Frontend template: [`apps/frontend/.env.example`](apps/frontend/.env.example)

```bash
# Paper ops (Python)
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0

# Front — CODEHASH flags optional: runtime explorer match is enough
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

Product SCs are **already deployed** (see `data/contracts.json`). Re-deploy only via runbook + PEM vault.

```bash
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0 PEM=/secure/mainnet.pem
./scripts/runbook_deploy.sh dry
./scripts/runbook_deploy.sh verify
```

LIA Ops live-funded **1.6038 EGLD** (nonce 1473, 7 Oct 2026). PEM never in git.

---

## Vellum / LIA

See [`README_LIA.md`](README_LIA.md) and [`docs/AUTONOMOUS_LIA.md`](docs/AUTONOMOUS_LIA.md).

## Docs

| Doc | Role |
|-----|------|
| [ANALYSE_DAPP_COMPLETE.md](docs/ANALYSE_DAPP_COMPLETE.md) | Recap + veille **8 oct** |
| [SLOT_PAYABLE_UPGRADE.md](docs/SLOT_PAYABLE_UPGRADE.md) | Pourquoi le spin EGLD est rejeté |
| [MX8004_FIRST100_ALIGNMENT.md](docs/MX8004_FIRST100_ALIGNMENT.md) | Phase 4 / First 100 — LIA → MX-8004 |
| [DEMO_WALKTHROUGH.md](docs/DEMO_WALKTHROUGH.md) | Parcours démo `/demo` |
| [GO_LIVE_DEPLOY.md](docs/GO_LIVE_DEPLOY.md) | Deploy SC |
| [REALITY_SWITCH.md](docs/REALITY_SWITCH.md) | Paper → live chrome |
| [PRIMORDIAL_SLOT.md](docs/PRIMORDIAL_SLOT.md) | Slot |
| [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | Env |

## License

MIT. No PEM, JWT, or private keys in git — ever.

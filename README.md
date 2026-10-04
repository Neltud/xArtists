# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists  

**Status (2026-10-02): GO_LIVE SC · LIA paper · house Slot 0.5 EGLD · 1st sale 0.25 EGLD**
- All product smart contracts have **non-null `codeHash`** (live-verified 2 Oct 2026)
- Runtime explorer match unlocks List / Buy / Stake / Spin **without** committing `VITE_*_CODEHASH_OK`
- **First sale proved** — `buyNft` 0.25 EGLD (ASFT-a6273a-01, epoch 2250). Book is empty again. Fee 3% = 0.0075 EGLD on SC
- Paper LIA by default (`LIA_LIVE_TRADING=0`) — no auto fund movement
- Slot casino **LIVE** — house **0.5 EGLD**. Last `spinEgld` REAL 0.1 **failed** (house intact)
- TRO stake **1 TRO** dust remaining (stake+unstake 1 TRO proved)
- **Supernova mainnet LIVE** since 10 Sep 2026 (epoch 2233) — 600 ms rounds · probe epoch **2251** (J+22)
- Indexer healthy: `/stats` `/economics` `/accounts` `/tokens` HTTP 200
- **LIA Ops 2.1057 EGLD** (nonce 1468). PEM stays off git.
- Legacy empty placeholders (`…8354t` etc.) must **never** receive funds
- Not a retail investment fund. Tips ≠ investment. User Connect ≠ LIA Ops.

Recap + veille (2 oct) : [`docs/ANALYSE_DAPP_COMPLETE.md`](docs/ANALYSE_DAPP_COMPLETE.md)  
Demo : https://neltud.github.io/xArtists/#/demo · GO_LIVE : https://neltud.github.io/xArtists/#/go-live

---

## What it is

| Layer | Role |
|-------|------|
| **Studio / Gallery** | Create & browse NFT collections (NFTUDURI live via API, 152) |
| **Marketplace** | List / Buy / Bid (SC live + 1 ASFT sale proved · book empty) |
| **Agents** | Limited LIA sub-agent packs (Pulse · Yield · Sentinel) |
| **LIA** | Autonomous agent (Guardian → Brain → paper until micro-proofs) |
| **$TRO** | Utility token — max supply product 500 000 · circ ~476 224 |
| **Slot** | Primordial Slot — house funded, REAL gated after last fail |

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

LIA Ops live-funded **2.1057 EGLD** (nonce 1468, 2 Oct 2026). PEM never in git.

---

## Vellum / LIA

See [`README_LIA.md`](README_LIA.md) and [`docs/AUTONOMOUS_LIA.md`](docs/AUTONOMOUS_LIA.md).

## Docs

| Doc | Role |
|-----|------|
| [ANALYSE_DAPP_COMPLETE.md](docs/ANALYSE_DAPP_COMPLETE.md) | Recap + veille **4 oct** |
| [MX8004_FIRST100_ALIGNMENT.md](docs/MX8004_FIRST100_ALIGNMENT.md) | Phase 4 / First 100 — LIA → MX-8004 |
| [DEMO_WALKTHROUGH.md](docs/DEMO_WALKTHROUGH.md) | Parcours démo `/demo` |
| [GO_LIVE_DEPLOY.md](docs/GO_LIVE_DEPLOY.md) | Deploy SC |
| [REALITY_SWITCH.md](docs/REALITY_SWITCH.md) | Paper → live chrome |
| [PRIMORDIAL_SLOT.md](docs/PRIMORDIAL_SLOT.md) | Slot |
| [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | Env |

## License

MIT. No PEM, JWT, or private keys in git — ever.

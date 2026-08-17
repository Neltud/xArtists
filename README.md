# xArtists

**AI trading + RWA / NFT marketplace on MultiversX mainnet**

dApp (GitHub Pages): https://neltud.github.io/xArtists/  
Repo: https://github.com/Neltud/xArtists  

**Status (2026-08-17): private / pre-mainnet release**  
- Paper LIA by default (`LIA_LIVE_TRADING=0`)  
- Marketplace & agents SC: **not live** (empty / null `codeHash`) until deploy + verify  
- UI fail-closed: no fake “live market” claims without on-chain code  
- **Code pleinement corrigé (v0.15.0+)** — analyse dApp + veille techno à jour  

---

## What it is

| Layer | Role |
|-------|------|
| **Studio / Gallery** | Create & browse NFT collections (phygital + digital) |
| **Marketplace** | List / Buy / Bid (on-chain only after SC deploy + codeHash) |
| **Agents** | Limited LIA sub-agent packs (≠ GreenSmoke forecast agents) |
| **LIA** | Autonomous trading agent (Guardian → Brain → paper/live) |
| **$TRO** | Utility token `TRO-94c925` — **max supply product 500 000** |
| **DAO** | Governance UI (read-first until SC + signature E2E) |
| **Treasury** | Foundation model: fees + tips + LIA PnL → Mission / Reserve / Reward / Ops |

Not a retail investment fund. No performance promises. Tips ≠ investment.

---

## Stack

| Area | Tech |
|------|------|
| Frontend | **Vite + React 18 + TypeScript + Tailwind** + `@multiversx/sdk-dapp` (`apps/frontend`) |
| Contracts | Rust (MultiversX) — marketplace, agents, treasury-splitter, RWA escrow, tro-burn… |
| LIA / ops | Python package `lia/` — Vellum pipeline, Guardian, oracles, board |
| Data | JSON under `data/` mirrored to `apps/frontend/public/data/` |
| CI | GitHub Actions → GH Pages |

> Source of truth for the live UI is **`apps/frontend`**. Legacy `src/` is debt.

---

## Architecture (short)

```
User wallet ──► dApp (Pages) ──► MultiversX mainnet SCs (when codeHash ≠ null)
                     ▲
                     │ JSON publish
LIA (Vellum) ──► production_run / pipeline ──► data/*.json
                     │
              Guardian (FAST) before Brain (SLOW)
```

**Wallets (do not mix):**

| Role | Usage |
|------|--------|
| **LIA Ops** | Protocol execution — never user session |
| **User Connect** | Tips / buys |
| **Mission / Reserve / Reward / Ops** | Treasury destinations (create before splitter deploy) |

LIA Ops (public): `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6`

---

## Security posture (gates)

```bash
PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.security.go_live_gates
```

Expected pre-deploy: `allow_live_trading=false`, marketplace `codeHash` null, agents null, micro_proofs = 0.

**Guardian** (before any size-up): VaR, Kelly, death-spiral score, kill-switch  
**Kill reset**: ops-only, never automatic (`docs/KILL_SWITCH_RESET.md`)

External audit pack: [`docs/AUDIT_EXTERNAL_FULL.txt`](docs/AUDIT_EXTERNAL_FULL.txt)

---

## Vellum / LIA operator

One command (paper + frontend data publish):

```bash
export CHAIN=1 LIA_LIVE_TRADING=0 PYTHONPATH=.
python -m lia.vellum.production_run
```

Timer cadence: **3–5 min**.  
Deploy SC is **opt-in** (`VELLUM_DEPLOY_SCS=1` + PEM secret only).

Full operator notes: [`docs/VELLUM_OPERATOR_NOW.md`](docs/VELLUM_OPERATOR_NOW.md)

---

## Deploy SC (mainnet only)

```bash
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0 PEM=/secure/mainnet.pem

./scripts/build_scs_isolated.sh all
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace

python scripts/post_deploy_contracts.py --marketplace erd1... --agents erd1...
python scripts/verify_marketplace_codehash.py
# then VITE_* + rebuild Pages — only if codeHash ≠ null
```

Runbook: [`docs/RUNBOOK_NOW.md`](docs/RUNBOOK_NOW.md) · [`docs/DEPLOYMENT_STEPS.md`](docs/DEPLOYMENT_STEPS.md)

**Never** remove market/agents banners until `codeHash` verified.

---

## Frontend local

```bash
cd apps/frontend
npm install
npm run dev
# build: npm run build
```

Optional Docker: `docker compose up --build` → local Pages-like path.

---

## Treasury split (post fee collection)

| Bucket | bps | Share |
|--------|-----|-------|
| Mission | 4000 | 40 % |
| Reserve | 3000 | 30 % |
| Reward  | 2000 | 20 % |
| Ops     | 1000 | 10 % |

SC: `contracts/treasury-splitter` · Policy: [`docs/TREASURY_POLICY.md`](docs/TREASURY_POLICY.md)

---

## Docs index

| Doc | Purpose |
|-----|---------|
| [ANALYSE_DAPP_COMPLETE.md](docs/ANALYSE_DAPP_COMPLETE.md) | **Analyse dApp + veille techno (17 août 2026)** |
| [ROADMAP_V1.md](docs/ROADMAP_V1.md) | 7 priorités V1 |
| [AUDIT_EXTERNAL_FULL.txt](docs/AUDIT_EXTERNAL_FULL.txt) | Full external audit |
| [VELLUM_OPERATOR_NOW.md](docs/VELLUM_OPERATOR_NOW.md) | Operator run |
| [TREASURY_POLICY.md](docs/TREASURY_POLICY.md) | Foundation treasury |
| [TREASURY_SPLITTER.md](docs/TREASURY_SPLITTER.md) | Splitter SC |
| [GUARDIAN_FAST_PATH.md](docs/GUARDIAN_FAST_PATH.md) | Risk FAST path |
| [KILL_SWITCH_RESET.md](docs/KILL_SWITCH_RESET.md) | Kill reset circuit |
| [FRONTEND_COMMANDER_ARCHITECTURE.md](docs/FRONTEND_COMMANDER_ARCHITECTURE.md) | Commander UI |
| [SECURITY_REMEDIATION_P0_P1.md](docs/SECURITY_REMEDIATION_P0_P1.md) | SC remediation |
| [RUNBOOK_NOW.md](docs/RUNBOOK_NOW.md) | Immediate ops |
| [STATUS.md](docs/STATUS.md) | Capability matrix |
| [STATUS_2026-08-17.md](docs/STATUS_2026-08-17.md) | Status du jour |

---

## Roadmap (strict order)

1. Create Mission + Reserve + Reward + Ops wallets  
2. Deploy nft-marketplace + agents-marketplace → **codeHash**  
3. `post_deploy` + Pages rebuild + micro-TX user  
4. Deploy treasury-splitter → route claimFees  
5. Paper stability → only then `LIA_LIVE_TRADING=1` for micro-size  

---

## Branding

- Product / gallery: **xArtists**  
- Artist identity may appear in bios, not as gallery product title  

---

## License / contribute

See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.  
No PEM, JWT, or private keys in git — ever.

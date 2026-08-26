# Étapes de build — xArtists

Ordre recommandé. **Mainnet only** (`CHAIN=1`). Aucun PEM dans le repo.

**Deploy SC (commandes) :** [`SC_DEPLOY_COMMANDS.md`](SC_DEPLOY_COMMANDS.md)

---

## 0. Prérequis

| Outil | Usage |
|-------|--------|
| Node 20+ / npm | Frontend Vite |
| Python 3.11+ | Package `lia/` |
| `mxpy` + Rust (sc-meta) | Build WASM smart contracts |
| Git | push → GitHub Actions → Pages |

```bash
git clone https://github.com/Neltud/xArtists.git
cd xArtists
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
```

---

## 1. Frontend (apps/frontend)

### Local dev

```bash
cd apps/frontend
npm ci
npm run dev
```

### Build production

```bash
cd apps/frontend
npm ci
npm run build
npm run preview
```

| Var | Rôle |
|-----|------|
| `VITE_MARKETPLACE_CODEHASH_OK` | `1` seulement après verify codeHash |
| `VITE_AGENTS_CODEHASH_OK` | idem agents |
| `VITE_WC_PROJECT_ID` | WalletConnect v2 (prod) |

Push `main` → workflow **deploy-pages** → https://neltud.github.io/xArtists/

---

## 2. Données LIA

```bash
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m lia.vellum.production_run
```

---

## 3. Smart contracts — commandes

```bash
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0
export PEM=/secure/mainnet.pem

# Build WASM
./scripts/build_scs_isolated.sh all

# Canonique
./scripts/runbook_deploy.sh dry
./scripts/runbook_deploy.sh deploy
./scripts/runbook_deploy.sh verify
# ou : ./scripts/runbook_deploy.sh all

# Ciblé
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace

# Post-deploy
python scripts/post_deploy_contracts.py --marketplace erd1... --agents erd1...
python scripts/verify_marketplace_codehash.py   # exit 0 avant VITE flags
bash scripts/post_deploy_verify.sh --query-views
```

Détail exhaustif : **[`SC_DEPLOY_COMMANDS.md`](SC_DEPLOY_COMMANDS.md)**

---

## 4. Gates

```bash
PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.security.go_live_gates
```

---

## 5. Checklist release paper

| # | Étape |
|---|--------|
| 1 | `npm run build` front OK |
| 2 | `production_run` paper |
| 3 | Health UI Brain/Fusion/Legs |
| 4 | `go_live_gates` → live false |
| 5 | Push → Pages |
| 6 | SC deploy seulement si EGLD + PEM prêts |
| 7 | codeHash verify **avant** `VITE_*_CODEHASH_OK=1` |

Vellum secrets : [`VELLUM_WORKFLOW_MAP.md`](VELLUM_WORKFLOW_MAP.md).

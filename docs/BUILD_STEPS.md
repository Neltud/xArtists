# Étapes de build — xArtists

Ordre recommandé. **Mainnet only** (`CHAIN=1`). Aucun PEM dans le repo.

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
npm ci          # ou npm install
npm run dev     # http://localhost:5173
```

### Build production (Pages-like)

```bash
cd apps/frontend
npm ci
npm run build   # tsc --noEmit && vite build → dist/
npm run preview # contrôle local du bundle
```

Variables d’environnement **build-time** (optionnel, fail-closed si absentes) :

| Var | Rôle |
|-----|------|
| `VITE_MARKETPLACE_CODEHASH_OK` | `1` seulement après verify codeHash |
| `VITE_AGENTS_CODEHASH_OK` | idem agents |
| `VITE_WC_PROJECT_ID` | WalletConnect v2 (prod) |
| `VITE_BASE` | base path Pages (`/xArtists/`) si besoin |

**Ne pas** mettre `VITE_*_CODEHASH_OK=1` tant que `scripts/verify_marketplace_codehash.py` ≠ exit 0.

### CI / GitHub Pages

Push sur `main` → workflow **deploy-pages** (`.github/workflows/deploy-pages.yml`) :

1. checkout  
2. `npm ci` + `npm run build` dans `apps/frontend`  
3. publish `dist/` vers GitHub Pages  

URL : https://neltud.github.io/xArtists/

---

## 2. Données LIA (mirror pour le front)

Le front lit `public/data/*.json` (Pages) ou raw GitHub.

```bash
# depuis la racine du repo
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m lia.vellum.production_run
# écrit data/ + apps/frontend/public/data/ + docs/data/
```

Phases utiles du run : gates → pipeline → compounding → signals → brain → paper_leg → mirror.

Commit + push des JSON publiés si Vellum n’a pas d’accès git write :

```bash
git add data/ apps/frontend/public/data/ docs/data/
git commit -m "data: production_run paper snapshot"
git push origin main
```

---

## 3. Smart contracts (Rust / WASM)

### Build seul (pas de deploy)

```bash
export CHAIN=1
./scripts/build_scs_isolated.sh all
# ou cibles : nft-marketplace | agents-marketplace | tro-staking | …
```

Sortie typique : `output/*.wasm` sous chaque contrat.

### Dry-run deploy (balance + gas)

```bash
export PEM=/secure/mainnet.pem FEE_BPS=300 CHAIN=1 LIA_LIVE_TRADING=0
./scripts/runbook_deploy.sh dry
```

### Deploy mainnet (coûte de l’EGLD)

```bash
./scripts/runbook_deploy.sh deploy
# ou ciblé :
./scripts/deploy_mainnet.sh nft-marketplace
./scripts/deploy_mainnet.sh agents-marketplace
```

### Post-deploy + verify (obligatoire avant flags VITE)

```bash
python scripts/post_deploy_contracts.py --marketplace erd1... --agents erd1...
python scripts/verify_marketplace_codehash.py   # doit exit 0
```

Puis rebuild front avec `VITE_*_CODEHASH_OK=1` et push.

Détail : [`DEPLOYMENT_STEPS.md`](DEPLOYMENT_STEPS.md) · [`RUNBOOK_NOW.md`](RUNBOOK_NOW.md)

---

## 4. Gates sécurité (avant tout live)

```bash
PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.security.go_live_gates
```

Attendu pré-deploy : `allow_live_trading=false`, codeHash null, micro_proofs = 0.

---

## 5. Checklist build « release paper »

| # | Étape | OK |
|---|--------|-----|
| 1 | `cd apps/frontend && npm ci && npm run build` | |
| 2 | `python -m lia.vellum.production_run` (paper) | |
| 3 | Health UI : Brain · Fusion · Legs · 10-col verts | |
| 4 | `go_live_gates` → live **false** | |
| 5 | Push `main` → Pages rebuild | |
| 6 | SC build seulement si deploy prévu | |
| 7 | **Jamais** `LIA_LIVE_TRADING=1` sans micro-preuves | |

---

## 6. Workflows GitHub utiles

| Fichier | Rôle |
|---------|------|
| `deploy-pages.yml` | Build Vite + publish Pages |
| `deploy-scs.yml` | Build/deploy SC (secrets) |
| `rust.yml` | CI Rust |
| `ci-cd.yml` / `e2e.yml` | checks |

---

## 7. Dépannage build front

| Symptôme | Action |
|----------|--------|
| `tsc` errors | Corriger types ; build bloque volontairement |
| data offline en local | Lancer `production_run` ou copier `data/` → `public/data/` |
| SC banners restent « pending » | Normal si codeHash null |
| WC ne connecte pas | `VITE_WC_PROJECT_ID` + domaine autorisé |

---

Vellum secrets (PEM, JWT Pinata) : hors git — voir [`VELLUM_WORKFLOW_MAP.md`](VELLUM_WORKFLOW_MAP.md).

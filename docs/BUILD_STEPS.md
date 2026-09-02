# Étapes de build — xArtists

Ordre recommandé. **Mainnet only** (`CHAIN=1`). Aucun PEM dans le repo.

| Doc | Contenu |
|-----|--------|
| [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) | **Toutes les variables d’env** |
| [`SC_DEPLOY_COMMANDS.md`](SC_DEPLOY_COMMANDS.md) | Commandes deploy SC |

---

## 0. Prérequis

```bash
git clone https://github.com/Neltud/xArtists.git
cd xArtists
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
```

Front env (optionnel) :

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
# éditer — ne pas activer VITE_*_CODEHASH_OK avant verify
```

---

## 1. Frontend

```bash
cd apps/frontend
npm ci
npm run dev      # local
npm run build    # prod
```

---

## 2. Données LIA

```bash
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m lia.vellum.production_run
```

---

## 3. Smart contracts

```bash
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0 PEM=/secure/mainnet.pem
./scripts/runbook_deploy.sh dry
./scripts/runbook_deploy.sh deploy
./scripts/runbook_deploy.sh verify
python scripts/verify_marketplace_codehash.py
```

Détail : [`SC_DEPLOY_COMMANDS.md`](SC_DEPLOY_COMMANDS.md)

---

## 4. Gates

```bash
PYTHONPATH=. LIA_LIVE_TRADING=0 python -m lia.security.go_live_gates
```

---

Variables complètes : [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md).

# Variables d’environnement — xArtists

**Règle :** secrets (PEM, JWT, HMAC) **jamais** dans git ni dans le bundle front.  
Front = préfixe `VITE_*` uniquement (build-time Vite).

---

## 1. Frontend (`apps/frontend`) — build-time

Fichier local (non commité) : `apps/frontend/.env` ou `.env.local`  
Modèle : [`apps/frontend/.env.example`](../apps/frontend/.env.example)

| Variable | Défaut / exemple | Rôle |
|----------|------------------|------|
| `VITE_WALLETCONNECT_PROJECT_ID` | `e07ac8e2a212711609b21dade4c9e37f` | WalletConnect v2 (Cloud allowlist domaineneltud.github.io`) |
| `VITE_DAPP_URL` | `https://neltud.github.io/xArtists` | Callback / deep link WC |
| `VITE_MARKETPLACE_ADDRESS` | *(vide)* | Adresse SC marketplace NFT post-deploy |
| `VITE_AGENTS_MARKETPLACE_ADDRESS` | *(vide)* | Adresse SC agents marketplace |
| `VITE_MARKETPLACE_CODEHASH_OK` | *(unset → false)* | `1` **seulement** après `verify_marketplace_codehash.py` exit 0 |
| `VITE_AGENTS_CODEHASH_OK` | *(unset → false)* | idem agents |
| `VITE_LIA_PROTOCOL_WALLET` | `erd1p4zyy…0crn6` | Adresse publique LIA ops (lecture) |
| `VITE_AGENTS_FEE_BPS` | `300` | Fee marketplace agents (3 %) |
| `VITE_NFT_MARKET_FEE_BPS` | `250` | Fee NFT (2,5 %) |
| `VITE_BASE` | `/xArtists/` si Pages | `base` Vite si besoin |

### GitHub Actions (Pages)

Secrets / vars repo (Settings → Secrets and variables) :

| Nom | Type | Quand |
|-----|------|--------|
| `VITE_WALLETCONNECT_PROJECT_ID` | variable ou secret | prod WC |
| `VITE_MARKETPLACE_ADDRESS` | variable | post-deploy |
| `VITE_AGENTS_MARKETPLACE_ADDRESS` | variable | post-deploy |
| `VITE_MARKETPLACE_CODEHASH_OK` | variable | `1` après verify |
| `VITE_AGENTS_CODEHASH_OK` | variable | `1` après verify |

Génération assistée : `python scripts/generate_vite_env.py`

---

## 2. LIA / Vellum / Python (runtime ops)

| Variable | Défaut | Rôle |
|----------|--------|------|
| `PYTHONPATH` | `.` (racine repo) | Import package `lia` |
| `CHAIN` | `1` | **Mainnet only** — pipeline refuse ≠ 1 |
| `LIA_CHAIN_ID` | — | Alias possible de chain id |
| `LIA_LIVE_TRADING` | `0` | `1` uniquement après micro-preuves + gates |
| `LIA_LIVE_CONFIRMED` | — | Confirmation ops supplémentaire (si utilisée) |
| `LIA_TP_MODE` | `log` | Mode take-profit paper/log |
| `VELLUM_DEPLOY_SCS` | `0` | `1` pour tenter deploy SC dans `production_run` |
| `PEM` | — | Chemin fichier PEM déployeur (**secret**) |
| `LIA_WALLET_PEM_PATH` | — | Alias PEM Vellum (**secret**) |
| `LIA_WALLET_PEM` | — | Contenu PEM inline Vellum vault (**secret**) |
| `LIA_AGENT_HMAC_SECRET` | — | Signature mark DecisionProof non-paper (**secret**) |
| `PINATA_JWT` | — | Pin IPFS côté ops proxy (**secret**) |
| `FEE_BPS` | `300` | Fee deploy marketplaces |
| `PROXY` | `https://gateway.multiversx.com` | Gateway MVX |
| `ONLY` | `all` | Cible script deploy (`nft-marketplace` / `agents-marketplace`) |
| `RUN_DEPLOY` | — | Interne `runbook_deploy` phase deploy |

### Commande paper standard

```bash
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m lia.vellum.production_run
```

### Deploy SC (opt-in)

```bash
export CHAIN=1 FEE_BPS=300 LIA_LIVE_TRADING=0
export PEM=/secure/mainnet.pem
export VELLUM_DEPLOY_SCS=1   # seulement si via production_run
./scripts/runbook_deploy.sh dry
```

---

## 3. Scripts shell (deploy)

Utilisées par `runbook_deploy.sh`, `deploy_mainnet.sh`, etc. :

| Variable | Obligatoire | Notes |
|----------|-------------|--------|
| `CHAIN=1` | oui | sinon refus |
| `PEM` ou `LIA_WALLET_PEM_PATH` | oui pour deploy | fichier local |
| `FEE_BPS` | recommandé | défaut 300 |
| `LIA_LIVE_TRADING=0` | recommandé | pendant deploy |
| `PROXY` | optionnel | gateway mainnet |
| `ONLY` | optionnel | filtre contrat |

Voir [`SC_DEPLOY_COMMANDS.md`](SC_DEPLOY_COMMANDS.md).

---

## 4. Ce qui ne doit **jamais** être dans le front

| Secret | Où |
|--------|-----|
| PEM / seed LIA ops | Vellum vault / disque ops chiffré |
| `PINATA_JWT` | proxy ops (`scripts/pinata_proxy_local.py`) |
| `LIA_AGENT_HMAC_SECRET` | Vellum only |
| Clés API exchange | Vellum only |

Le front n’a **pas** de PEM provider (`sdkDappConfig.providers.pem = false`).

---

## 5. Exemple minimal paper (dev)

```bash
# Shell
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0

# apps/frontend/.env.local (optionnel)
# VITE_WALLETCONNECT_PROJECT_ID=e07ac8e2a212711609b21dade4c9e37f
# VITE_DAPP_URL=http://localhost:5173
# pas de VITE_*_CODEHASH_OK tant que SC non vérifié
```

## 6. Exemple post-deploy (prod Pages)

```bash
# Après verify_marketplace_codehash.py exit 0
export VITE_MARKETPLACE_ADDRESS=erd1qqqq...
export VITE_AGENTS_MARKETPLACE_ADDRESS=erd1qqqq...
export VITE_MARKETPLACE_CODEHASH_OK=1
export VITE_AGENTS_CODEHASH_OK=1
export VITE_WALLETCONNECT_PROJECT_ID=e07ac8e2a212711609b21dade4c9e37f
cd apps/frontend && npm ci && npm run build
```

---

Liens : [`BUILD_STEPS.md`](BUILD_STEPS.md) · [`SC_DEPLOY_COMMANDS.md`](SC_DEPLOY_COMMANDS.md) · [`VELLUM_WORKFLOW_MAP.md`](VELLUM_WORKFLOW_MAP.md)

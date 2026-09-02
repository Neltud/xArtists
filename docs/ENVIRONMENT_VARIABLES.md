# Variables d’environnement — xArtists

**Règle :** secrets (PEM, JWT, HMAC) **jamais** dans git ni dans le bundle front.  
Front = préfixe `VITE_*` uniquement (build-time Vite).

Deploy via Vellum : [`VELLUM_DEPLOY.md`](VELLUM_DEPLOY.md)

---

## 1. Frontend (`apps/frontend`) — build-time

Modèle : [`apps/frontend/.env.example`](../apps/frontend/.env.example)

| Variable | Défaut / exemple | Rôle |
|----------|------------------|------|
| `VITE_WALLETCONNECT_PROJECT_ID` | project id WC | WalletConnect v2 |
| `VITE_DAPP_URL` | `https://neltud.github.io/xArtists` | Callback WC |
| `VITE_MARKETPLACE_ADDRESS` | *(vide)* | SC NFT post-deploy |
| `VITE_AGENTS_MARKETPLACE_ADDRESS` | *(vide)* | SC agents |
| `VITE_MARKETPLACE_CODEHASH_OK` | unset → false | `1` après verify only |
| `VITE_AGENTS_CODEHASH_OK` | unset → false | idem |
| `VITE_LIA_PROTOCOL_WALLET` | erd1p4zyy… | LIA ops public |
| `VITE_AGENTS_FEE_BPS` | `300` | Fee agents |
| `VITE_NFT_MARKET_FEE_BPS` | `250` | Fee NFT |

---

## 2. LIA / Vellum / Python

| Variable | Défaut | Rôle |
|----------|--------|------|
| `PYTHONPATH` | `.` | Package `lia` |
| `CHAIN` / `LIA_CHAIN_ID` | `1` | Mainnet only |
| `LIA_LIVE_TRADING` | `0` | Live trading gate |
| `VELLUM_DEPLOY_SCS` | `0` | `1` = phase deploy dans `production_run` |
| `VELLUM_DEPLOY_DRY` | `0` | `1` = build SC sans `--send` |
| `DEPLOY_CONTRACT` | `all` | `nft-marketplace` \| `agents-marketplace` \| `all` |
| `PEM` / `LIA_WALLET_PEM` / `LIA_WALLET_PEM_PATH` | — | **Secret** deploy |
| `LIA_MVX_PROXY` / `PROXY` | gateway mainnet | API |
| `FEE_BPS` | `300` | Constructeur SC |
| `LIA_AGENT_HMAC_SECRET` | — | DecisionProof (**secret**) |
| `PINATA_JWT` | — | IPFS ops (**secret**) |

### Paper

```bash
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
python -m lia.vellum.production_run
```

### Deploy via Vellum

```bash
export PYTHONPATH=. CHAIN=1 LIA_LIVE_TRADING=0
export VELLUM_DEPLOY_SCS=1
export VELLUM_DEPLOY_DRY=1   # d’abord
# vault: LIA_WALLET_PEM
python -m lia.vellum.production_run
```

---

## 3. Interdits front

PEM · seeds · `PINATA_JWT` · HMAC — **jamais** en `VITE_*`.

Liens : [`BUILD_STEPS.md`](BUILD_STEPS.md) · [`SC_DEPLOY_COMMANDS.md`](SC_DEPLOY_COMMANDS.md) · [`VELLUM_DEPLOY.md`](VELLUM_DEPLOY.md)

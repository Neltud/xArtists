# Variables d’environnement — xArtists

**Règle :** secrets (PEM, JWT, HMAC) **jamais** dans git ni dans le bundle front.  
Front = préfixe `VITE_*` uniquement (build-time Vite).

Architecture & sécurité financière : [`docs/adr/0001-xartists-architecture-v1.md`](adr/0001-xartists-architecture-v1.md)  
Deploy via Vellum : [`VELLUM_DEPLOY.md`](VELLUM_DEPLOY.md)

---

## 1. Frontend (`apps/frontend`) — build-time

Modèle : [`apps/frontend/.env.example`](../apps/frontend/.env.example)

| Variable | Défaut / exemple | Rôle |
|----------|------------------|------|
| `VITE_ACCESS_API_BASE` | URL Access API | Sessions Stripe/Paybox (montants côté serveur) |
| `VITE_PAYBOX_ENABLED` | `false` | Opt-in Paybox ; rester `false` jusqu’à HMAC + IPN + mint |
| `VITE_LIA_LIVE_TRADING` | `0` | **Doit rester 0** en CI / Pages — pas de trading autonome front |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_…` | Publishable only |
| `VITE_STRIPE_PAYMENT_LINK_*` | URL Dashboard | Fallback links (après preuve liaison wallet) |
| `VITE_WALLETCONNECT_PROJECT_ID` | project id WC | WalletConnect v2 |
| `VITE_DAPP_URL` | `https://neltud.github.io/xArtists` | Callback WC |
| `VITE_MARKETPLACE_ADDRESS` | erd1… | SC NFT |
| `VITE_AGENTS_MARKETPLACE_ADDRESS` | erd1… | SC agents |
| `VITE_*_CODEHASH_OK` | unset → false | `1` après verify only — **ne pas committer =1** |
| `VITE_LIA_PROTOCOL_WALLET` | erd1… | LIA ops **public** (≠ User Connect) |
| `VITE_AGENTS_FEE_BPS` | `300` | Fee agents |
| `VITE_NFT_MARKET_FEE_BPS` | `250` | Fee NFT |

**Caps produit (ADR 0001, non enforcement serveur tant que non câblé) :** 5 USD/ordre · 15 USD/jour · 50 bps slippage.

---

## 2. LIA / Vellum / Python

| Variable | Défaut | Rôle |
|----------|--------|------|
| `PYTHONPATH` | `.` | Package `lia` |
| `CHAIN` / `LIA_CHAIN_ID` | `1` | Mainnet only |
| `LIA_LIVE_TRADING` | `0` | Live trading gate — **rester 0** jusqu’à Upbit + micro-proofs + Guardian |
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

Liens : [`BUILD_STEPS.md`](BUILD_STEPS.md) · [`SC_DEPLOY_COMMANDS.md`](SC_DEPLOY_COMMANDS.md) · [`VELLUM_DEPLOY.md`](VELLUM_DEPLOY.md) · [`adr/0001-xartists-architecture-v1.md`](adr/0001-xartists-architecture-v1.md)

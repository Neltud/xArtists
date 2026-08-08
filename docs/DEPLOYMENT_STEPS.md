# Deployment steps — MultiversX MAINNET only

> **Canonical runbook:** [`docs/RUNBOOK_DEPLOY.md`](RUNBOOK_DEPLOY.md)  
> **One command:** `./scripts/runbook_deploy.sh all`

## Quick path

```bash
export PEM=/path/to/mainnet.pem FEE_BPS=300 CHAIN=1 LIA_LIVE_TRADING=0

./scripts/runbook_deploy.sh dry      # free
./scripts/runbook_deploy.sh deploy  # costs EGLD
./scripts/runbook_deploy.sh verify  # codeHash + VITE
# or: ./scripts/runbook_deploy.sh all
```

## Prerequisites

| Item | Value |
|------|--------|
| Network | Mainnet `CHAIN=1` |
| Proxy | `https://gateway.multiversx.com` |
| Fee | `FEE_BPS=300` |
| PEM | LIA ops deployer (owner SC) |
| Balance | >= ~0.25 EGLD recommended |

## Order

1. `dry` — build + gas + balance  
2. `deploy` — agents + nft marketplaces  
3. `verify` — codeHash non-null  
4. Inject `VITE_*_CODEHASH_OK=1` → rebuild Pages  
5. Micro List/Buy **user** wallet  
6. Keep `LIA_LIVE_TRADING=0` until micro-trades OK  

Errors: `docs/DEPLOY_ERRORS.md` · details: `docs/SC_DEPLOY_OPTIMIZED.md`

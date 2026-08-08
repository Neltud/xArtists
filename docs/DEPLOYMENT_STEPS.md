# Deployment steps — MultiversX MAINNET only

> Canonical optimized flow: **docs/SC_DEPLOY_OPTIMIZED.md**

## Quick path (recommended)

```bash
export PEM=/path/to/mainnet.pem   # never commit
export FEE_BPS=300 CHAIN=1

./scripts/preflight_deploy_mainnet.sh
RUN_DEPLOY=1 ./scripts/deploy_optimized_mainnet.sh
python scripts/verify_marketplace_codehash.py
```

Legacy:

```bash
./scripts/simulate_deploy_mainnet.sh
./scripts/deploy_mainnet.sh agents-marketplace
./scripts/deploy_mainnet.sh nft-marketplace
python scripts/post_deploy_contracts.py --agents erd1… --marketplace erd1…
```

## Prerequisites

| Item | Value |
|------|--------|
| Network | Mainnet only `CHAIN=1` |
| Proxy | `https://gateway.multiversx.com` |
| Tooling | `mxpy`, `sc-meta` or `mxpy contract build` |
| Fee | `FEE_BPS=300` (3 %) |
| PEM | Deployer = LIA ops wallet (owner SC) |
| Balance | ≥ ~0.15–0.30 EGLD (2 SC + buffer) |

## Order

1. Preflight / gas estimate per WASM  
2. Deploy `agents-marketplace` then `nft-marketplace` (or `ONLY=…`)  
3. Confirm tx (adaptive poll)  
4. `post_deploy_contracts.py` + `verify_marketplace_codehash.py`  
5. Set `VITE_*_ADDRESS` + `VITE_*_CODEHASH_OK=1`  
6. Rebuild GitHub Pages  
7. Blackbox + micro List/Buy (user wallet ≠ LIA)  
8. Keep `LIA_LIVE_TRADING=0` until micro-trades OK  

## Errors

See `docs/DEPLOY_ERRORS.md` and recovery matrix in `docs/SC_DEPLOY_OPTIMIZED.md`.

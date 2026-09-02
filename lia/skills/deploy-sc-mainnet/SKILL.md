---
name: lia-deploy-sc-mainnet
description: Deploy nft-marketplace and agents-marketplace on MultiversX mainnet only.
---

# Deploy SC mainnet

## Preconditions

- PEM offline, never committed
- EGLD for gas on deployer (often LIA ops wallet)
- Read `docs/RUNBOOK_DEPLOY.md`

## Order

1. `./scripts/preflight_deploy_mainnet.sh` (or simulate gas)
2. `PEM=/path/mainnet.pem ./scripts/deploy_mainnet.sh` with `FEE_BPS=300`
3. `python scripts/post_deploy_contracts.py --marketplace erd1... --agents erd1...`
4. `python scripts/verify_marketplace_codehash.py` → codeHash non-null
5. Set `VITE_MARKETPLACE_*` / `VITE_AGENTS_*` / `CODEHASH_OK=1`
6. Rebuild GitHub Pages
7. Micro List/Buy with **user** wallet (not LIA ops)

## Success

- `data/contracts.json` addresses filled
- Banner SC pending disappears after rebuild
- `claimFees` only owner

## Forbidden

- Devnet deploys for production narrative
- Claiming market live without codeHash verify

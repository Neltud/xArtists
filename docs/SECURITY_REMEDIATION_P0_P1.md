# Security remediation P0 + P1 — 2026-08-02

Applied on `contracts/agents-marketplace` and `contracts/nft-marketplace`.

**Network policy: MAINNET ONLY.**  
Operator path: **[MAINNET_DEPLOY_BLACKBOX.md](MAINNET_DEPLOY_BLACKBOX.md)**

## P0 / P1 status

All P0+P1 items applied in SC source (pause, CEI, fee+royalty cap, accumulated_fees, 2-step ownership, agent_id len, storage-owner ACL).

## Scripts

```bash
./scripts/build_scs_isolated.sh
./scripts/deploy_mainnet.sh                 # CHAIN=1 FEE_BPS=300
./scripts/deploy_mainnet.sh agents-marketplace
```

`deploy_devnet.sh` exits with error (disabled).

## Deploy note

Redeploy on mainnet required for on-chain effect. Update `data/contracts.json` + frontend env after deploy.

## P2 remaining

- NFT collection whitelist
- Multisig owner
- External audit
- Bridge redesign

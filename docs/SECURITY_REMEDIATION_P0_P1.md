# Security remediation P0 + P1 — 2026-08-02

Applied on `contracts/agents-marketplace` and `contracts/nft-marketplace`.

Full operator path: **[DEVNET_DEPLOY_BLACKBOX.md](DEVNET_DEPLOY_BLACKBOX.md)**

## P0

| Item | Status |
|------|--------|
| Upgrade gated by storage owner | Done both |
| NFT listing exists check | Done |
| Cap fee + royalty ≤ 100% | Done list + buy |
| CEI active=false before transfers | Done both |
| Bridge experimental label | Done README |
| Blackbox tests | See DEVNET_DEPLOY_BLACKBOX.md |

## P1

| Item | Status |
|------|--------|
| Pause agents | Done |
| NFT excess refund | Done |
| transferOwnership 2-step | Done both |
| accumulated_fees vs full balance | Done both |
| agent_id max length 64 | Done |

## Scripts

```bash
./scripts/build_scs_isolated.sh
./scripts/deploy_devnet.sh              # CHAIN=D FEE_BPS=300
./scripts/deploy_devnet.sh agents-marketplace
```

## Deploy note

Redeploy required for on-chain effect. Old instances stay until new address + contracts.json update.

## P2 remaining

- NFT collection whitelist
- Multisig owner
- External audit
- Bridge redesign

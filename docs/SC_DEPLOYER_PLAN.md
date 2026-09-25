# SC Deployer plan

## Address (public)

```
erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g
```

Mainnet · fund with EGLD for gas · PEM held offline (sandbox ops) — **never git**.

## Flow

1. Fund deployer (≥ 0.5 EGLD recommended)
2. Build + deploy: nft-staking, tro-staking, (optional marketplaces)
3. Verify codeHash on explorer
4. Write addresses → `data/contracts.json`
5. Optional: `renounceOwnership` for immutability of admin
6. Front: set addresses + CODEHASH flags only after verify

## Immutability model

- **No `upgrade` endpoint** on staking SCs
- Admin: pause / allowlist until `renounceOwnership`
- After renounce: users can still stake/unstake; no further admin

## After deploy

Users and LIA interact with **SC addresses** only. Deployer PEM not needed for user txs.

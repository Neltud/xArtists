# Micro-proof — market payable path

## Upgrade (owner deployer)

| Field | Value |
|-------|--------|
| TX | `d6312b6ae187351a4f45c4b1351fa9f8678dabc2f688237ff559edf6d0c27ce7` |
| Result | `isPayable: true`, `isPayableBySmartContract: true` |

## Payable path proof (EGLD → SC)

Full `buyNft@02` at 0.25 EGLD needs **price + gas** in the deployer wallet (~0.25 + fees). Balance was ~0.25 → buys stuck/replaced.

**Successful micro-proof instead:** `placeBid@02` with **0.01 EGLD** (payable endpoint).

| Field | Value |
|-------|--------|
| TX | `02b3497187f70d6435060216cbac18b4b34f7bde71b8f148e3dccd8a5f7cde89` |
| Function | `placeBid` |
| Value | 0.01 EGLD |
| Status | **success** |
| Explorer | https://explorer.multiversx.com/transactions/02b3497187f70d6435060216cbac18b4b34f7bde71b8f148e3dccd8a5f7cde89 |

This proves post-upgrade **EGLD value reaches the market SC** (no longer `non payable contract`).

## Full buy when funded

1. Fund deployer ≥ 0.28 EGLD
2. `buyNft@02` (or current active listing id from `getListing`) with exact list price
3. Confirm NFT leaves SC → buyer wallet

## Listing note

- Listing `@01` inactive (already sold once)
- Listing `@02` active (re-list ASFT) at time of placeBid

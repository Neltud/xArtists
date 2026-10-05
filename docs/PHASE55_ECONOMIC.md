# Phase 5.5 status

| Rule | Implementation |
|------|----------------|
| Mint → +1 TRO | `rwa_minter --confirm-mint` → `record_mint` |
| Sold+Shipped → −1 TRO | `fulfillment --ship` → `record_burn` |
| LIA no NFT | `agent_constraints.assert_tradable_asset` |
| Integrity | `economic_validator.validate()` |
| UI pulse | `EconomicPulse` (wire into HolderTerminal) |

Demo integrity: minted 1, burned 1, circulating 0, ok=true.

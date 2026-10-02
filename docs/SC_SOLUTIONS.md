# Solutions SC mainnet (probe 2026-10-03)

Deployer tests + bytecode string mining.

## Working today

| SC | Endpoints OK |
|----|----------------|
| tro_staking | `stake` (ESDTTransfer TRO), `unstake` |
| treasury | `receiveAndSplit` |
| venue | `rentPay@wallId` |
| marketplace | `listNft`, `buyNft` (user-proven) |

## Broken / missing — solutions

### 1. Slot — spin EGLD

**Symptom:** `spinEgld@seed` + value EGLD → `ESDT expected`.  
`lockSpinEgld` / `play` → `function not found`.

**Cause:** Deployed wasm exposes `spinEgld` / `spinEsdt` but payment path treats call as ESDT. Local `slot_lib_full.rs` (`lockSpinEgld`) **≠** bytecode on-chain.

**Solution:**
1. Rebuild slot from source that matches intended API (`#[payable("EGLD")]` + client seed).
2. `upgrade` from deployer owner `erd1kex0…`.
3. Microtest: `lockSpinEgld` or fixed `spinEgld` ≥ `getMinBet` (0.001 EGLD).
4. Then re-enable front `spinEgld` (remove honest block in `useSlotTx`).

Until then: **Fun/paper only** on front.

### 2. Agents packs mint

**Symptom:** `mint` / `buyPack` / `purchase` → not found.

**Real endpoints:** `listAgentAction`, `buyAgentAction@listingId`, `cancelListing`, `claimFees`.

**Solution:**
- Packs product = **paper** OR list agent NFTs then `buyAgentAction`.
- Optional: new minter SC + wire address; do not fake `buyPack`.

### 3. TRO claim

**Symptom:** `claim` / `claimRewards` not found.

**Solution:** No claim endpoint on deployed staking — rewards may be none or auto. UI must not promise claim.

### 4. Governance vote

**Symptom:** `vote` → `ended`.

**Solution:** `createProposal` then vote while active; or UI paper.

### 5. NFT staking / escrow

Endpoints differ (`stakeNft` in repo source). Align ABI or hide UI actions.

## Front changes shipped

- `useSlotTx.spinEgld` → honest error (no gas burn).
- `useAgentPackTx` → `buyAgentListing` uses `buyAgentAction`; pack mint stays paper.

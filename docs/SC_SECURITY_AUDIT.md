# SC Security Audit Checklist — pre mainnet public

**Deployer funded**: `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` (~0.58 EGLD)
**Treasury LIA**: `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6`

## Global rules

- [x] No PEM in git
- [ ] codeHash verified post-deploy before any UI live flag
- [ ] Fee / rake → LIA treasury (owner claim or fixed treasury)
- [ ] Pause fail-closed
- [ ] CEI pattern on value moves
- [ ] No unbounded loops on user input
- [ ] Reentrancy: no external calls before state finalization (MVX async careful)
- [ ] Integer: BPS caps, amount > 0 checks

## Per contract

### nft-staking
- [x] No upgrade endpoint
- [x] renounceOwnership
- [x] stake amount == 1 NFT
- [x] only staker unstakes
- [ ] Allowlist collections before public
- [ ] Rewards pool (phase 2) — not in v1 principal-only

### tro-staking
- [x] Token fixed at init
- [x] No yield promise on-chain
- [x] renounceOwnership
- [ ] Confirm TRO-94c925 id at deploy

### nft-marketplace / agents-marketplace
- [x] fee_bps cap 10%
- [x] claimFees owner-only → transferOwnership to LIA after deploy
- [x] Bid refunds previous bidder
- [ ] Agent resale = same list/buy path (product NFT)
- [ ] Disclaimer: packs ≠ investment

### slot-casino
- [x] Provably fair commit-reveal
- [x] Progressive + house rake BPS
- [ ] claimHouse → LIA after ownership transfer
- [ ] Seed progressive after deploy
- [ ] Soft launch bet caps

### tro-governance
- [x] Vote power = LP weight (owner oracle) + ArtPass staked
- [x] One vote per address per proposal
- [x] Treasury sweep only to LIA
- [ ] LP weight oracle process documented (ops)
- [ ] ArtPass collection nonce handling hardened before mainnet

## Deploy order (micro-EGLD)

1. nft-staking
2. tro-staking  
3. tro-governance (treasury=LIA)
4. nft-marketplace (fee 250–300 bps) → transferOwnership LIA
5. agents-marketplace → transferOwnership LIA
6. slot-casino (optional) → transferOwnership LIA

## Post-deploy

1. Verify each codeHash ≠ null
2. Update `data/contracts.json`
3. Front addresses + disclaimers
4. Soft public — no "investment" language on packs

# Security remediation P0 + P1 — 2026-08-02

Applied on `contracts/agents-marketplace` and `contracts/nft-marketplace`.

## P0

| Item | Status |
|------|--------|
| Upgrade only owner | Done both |
| NFT listing exists check | Done |
| Cap fee + royalty ≤ 100% | Done list + buy |
| CEI active=false before transfers | Done both |
| Bridge experimental label | Done README |
| Blackbox tests | Checklist below — run on devnet |

## P1

| Item | Status |
|------|--------|
| Pause agents | Done |
| NFT excess refund | Done |
| transferOwnership 2-step | Done both |
| accumulated_fees vs full balance | Done both |
| agent_id max length 64 | Done |

## Blackbox checklist (devnet)

### Agents

- [ ] list price 0 → fail
- [ ] list agent_id empty or >64 → fail
- [ ] buy missing id → fail
- [ ] buy inactive → fail
- [ ] buy exact → seller net, accumulated_fees += fee
- [ ] buy overpay → excess refunded
- [ ] cancel non-seller → fail
- [ ] setPaused true → list/buy fail
- [ ] claimFees non-owner → fail
- [ ] claimFees owner → accumulated_fees 0, owner receives fee total
- [ ] transferOwnership + acceptOwnership from other → fail until accept

### NFT

- [ ] list without NFT → fail
- [ ] list royalty 1000 + fee 300 OK; royalty such that sum >10000 → fail
- [ ] buy missing id → fail
- [ ] buy overpay → excess refunded
- [ ] cancel → NFT back to seller
- [ ] pause → list/buy fail

## Deploy note

Redeploy required for on-chain effect. Previous instances without these endpoints stay as-is until migrated.

## P2 remaining

- NFT collection whitelist
- Multisig owner
- External audit
- Bridge redesign

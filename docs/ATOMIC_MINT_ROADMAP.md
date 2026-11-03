# Atomic pack mint roadmap (post-#310)

## Why live mint is refused today

Manual/auto path was:

```
setPackPrice(pack, P) → buyPack(pack) @ value P → setPackPrice(pack, Rule1) → transfer NFT
```

Problems:

1. **Non-atomic** — between the two `setPackPrice` calls, any party can buy at the temporary price.
2. **Admin key in CI** — production PEM in Actions expands blast radius if workflow compromised.
3. **Deployer as buyer** — treasury pays EGLD then transfers NFT; not “user paid chain fee”, it’s subsidized mint.
4. **micro_price** amplifies (1) to near-zero sale window.

#310 correctly: `live_mint=true` → hard fail; live job `if: false`; dry-run only.

**Re-enabling that sequence is not “GO live mint”. It is a known vulnerability.**

---

## Target architectures (choose one)

### A — Fixed on-chain catalogue (recommended MVP)

- SC stores immutable or governance-timelocked prices: Pulse 33 / Yield 22.5 / Sentinel 15 EGLD (or EUR-oracle later).
- `buyPack(packType)` requires `msg.value == packPrice[packType]` — **no** pre-tx price mutate.
- Endpoint: user wallet **or** deployer relay with **user signature** + payment already proven off-chain is a different product; pure chain path = user pays value.
- Ops: **one-time** admin `setPackPrice` to Rule1 when funded, then **remove** admin hot path from CI (or timelock).

### B — Payment token / stable escrow SC

- Fiat PayBox → credit internal ledger → user claims NFT with EIP-712/MultiversX signed voucher from **hot claim key** (not full deployer).
- Claim function: `claimPack(orderId, pack, sig)` mints/transfers **one** NFT; voucher single-use in SC mapping.
- No global price window; no setPackPrice in mint workflow.

### C — Pre-mint inventory

- Deployer pre-mints N SFTs at leisure under controlled prices offline.
- Delivery = `ESDTNFTTransfer` only (still needs careful auth), **no** buyPack in payment path.
- Inventory accounting in Postgres; still not “buyPack atomic” but removes price race.

**Recommendation:** **A** for crypto-native packs + **B** for fiat-first (PayBox) delivery. CI mint workflow becomes claim/transfer only, never setPackPrice.

---

## Re-open live mint checklist (engineering GO)

- [ ] SC path without mid-flight `setPackPrice`
- [ ] Independent security review notes on claim/buy
- [ ] Deployer or claim-key funding model documented
- [ ] S2 receipt verifier wired to mark `mint_jobs.confirmed`
- [ ] `#310` lock replaced by **new** workflow (not silent `if: true` on old job)
- [ ] Staging dry-run on testnet/devnet first
- [ ] Written product GO (human) separate from merge

Until then: **dry-run + OIDC pull only**.

---

## GO ALL — honest matrix

| System | GO? |
|--------|-----|
| Pages / packs UX / museum / signals | **YES** |
| API + PayBox config + SIWX | **YES** |
| OIDC dry-run mint pull | **YES** |
| Public card checkout | **NO** until `PAYBOX_CHECKOUT_ENABLED` + support |
| Live chain mint | **NO** until atomic path |
| LIA trading | **NO** |
| Solana bridge | **NO** |

“GO ALL” operationally = max surface area **without** lying about delivery or reopening a price race.

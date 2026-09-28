# GO_LIVE Status — venue-split & production

**Updated:** 2026-09-28 17:12 CEST  
**Rule:** paper fail-closed until codeHash verified on the **real** SC address.

---

## Sign-off audit §1 (contract)

| Check | Status |
|-------|--------|
| Split bps = 10_000 (40/20/25/15) | ✅ signed |
| No setSplit / no owner withdraw | ✅ signed |
| Pause ≠ sweep · dust → holders | ✅ signed |
| PEM hors repo / front | ✅ signed |

**§1:** APPROVED for deploy after buckets + wasm + fund.

---

## Checklist production

| # | Step | Status |
|---|------|--------|
| 1 | Audit §1 sign-off | ✅ DONE |
| 2 | Deploy mainnet (4 buckets) | 🟡 **FUNDED** · waiting **4 bucket addresses** + **wasm build** |
| 3 | verify_venue_codehash CHAIN=mainnet | ❌ waiting SC address |
| 4 | Micro rentPay dust | ❌ waiting SC |
| 5 | Secrets Pages + rebuild | ❌ do **not** set CODEHASH_OK yet |
| 6 | Annonce publique | ❌ after 2→5 |

### Deployer

| Field | Value |
|-------|--------|
| Address | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |
| Mainnet balance | **0.1 EGLD** (confirmed 2026-09-28) |
| Nonce | 3 |
| PEM ↔ address | matched |

### Buckets (REQUIRED before deploy — immutable at init)

```text
INSTITUTION_ADDR=   # musée / institution receive
ASSOCIATIONS_ADDR=  # associations art
LIA_TREASURY_ADDR=  # default candidate: erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6
HOLDERS_POOL_ADDR=  # rewards pool SC or escrow wallet
```

**Do not deploy** with all four = LIA (breaks product economics permanently).

### Front

| Env | Value |
|-----|--------|
| `VITE_VENUE_SC_ADDRESS` | empty |
| `VITE_VENUE_CODEHASH_OK` | false |
| Behaviour | **paper fail-closed** ✅ |

---

## Next command (ops, when buckets filled)

```bash
export SC_DEPLOYER_PEM=…
export INSTITUTION_ADDR=erd1…
export ASSOCIATIONS_ADDR=erd1…
export LIA_TREASURY_ADDR=erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6
export HOLDERS_POOL_ADDR=erd1…
# build wasm (sc-meta / mxpy contract build)
# then deploy mainnet chain=1
# then:
export VENUE_SC_ADDRESS=<new>
export CHAIN=mainnet
./scripts/verify_venue_codehash.sh
./scripts/rentpay_micro_test.sh  # CHAIN=1 PROXY=mainnet gateway
```

# GO_LIVE Status — venue-split & production

**Updated:** 2026-09-28  
**Rule:** paper fail-closed until codeHash verified on the **real** SC address.

---

## Sign-off audit §1 (contract)

| Check | Status |
|-------|--------|
| Split bps = 10_000 (40/20/25/15) | ✅ signed |
| No setSplit after init | ✅ signed |
| No owner withdraw / sweep | ✅ signed |
| Pause only blocks new rentPay | ✅ signed |
| Dust → holders | ✅ signed |
| Zero-address rejected at init | ✅ signed |
| No PEM in repo / front | ✅ signed |
| Upgrade = policy do-not-use post live | ⚠️ accepted residual |

**Sign-off §1:** **APPROVED for testnet deploy and for mainnet deploy only after steps 2–4 below are green.**  
Source: `docs/AUDIT_VENUE_MAINNET.md` · code `contracts/venue_split/src/lib.rs`

---

## Checklist production

| # | Step | Status |
|---|------|--------|
| 1 | Audit §1 sign-off | ✅ **DONE** |
| 2 | Deploy mainnet (4 final bucket addresses) | ❌ **BLOCKED** — deployer balance 0 EGLD |
| 3 | `verify_venue_codehash.sh CHAIN=mainnet` | ❌ waiting address |
| 4 | Micro rentPay dust | ❌ waiting SC |
| 5 | Secrets Pages + rebuild | ❌ do **not** set CODEHASH_OK yet |
| 6 | Public announcement | ❌ only after 2–5 |

### Deployer (ops)

| Field | Value |
|-------|--------|
| Address | `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g` |
| Mainnet balance (2026-09-28) | **0 EGLD** |
| Nonce | 3 |
| PEM | sandbox / GH secret only — never front |

**Action required:** fund deployer with ≥ **0.05–0.15 EGLD** (deploy gas + dust rentPay), then run deploy with 4 bucket addresses.

### Bucket addresses (fill before deploy)

```text
INSTITUTION_ADDR=
ASSOCIATIONS_ADDR=
LIA_TREASURY_ADDR=
HOLDERS_POOL_ADDR=
```

### Front (current)

| Env | Value |
|-----|--------|
| `VITE_VENUE_SC_ADDRESS` | empty |
| `VITE_VENUE_CODEHASH_OK` | unset / false |
| Behaviour | **paper fail-closed** ✅ |

---

## Do not

- Set `VITE_VENUE_CODEHASH_OK=1` without explorer codeHash match  
- Announce mainnet SC live while balance 0 / no address  
- Commit PEM to git  
- Use upgrade after GO_LIVE  

---

## Resume sequence (when funded)

```bash
export SC_DEPLOYER_PEM=…
export INSTITUTION_ADDR=erd1…
export ASSOCIATIONS_ADDR=erd1…
export LIA_TREASURY_ADDR=erd1…
export HOLDERS_POOL_ADDR=erd1…
# Prefer testnet first if not already verified:
# CHAIN=D PROXY=https://devnet-gateway.multiversx.com ./scripts/deploy_venue_split_testnet.sh

# Mainnet (only after §1 + buckets reviewed):
mxpy contract build   # in contracts/venue_split
mxpy contract deploy --bytecode=output/*.wasm --pem=$SC_DEPLOYER_PEM \
  --gas-limit=60000000 --proxy=https://gateway.multiversx.com --chain=1 \
  --arguments addr:$INSTITUTION_ADDR addr:$ASSOCIATIONS_ADDR \
  addr:$LIA_TREASURY_ADDR addr:$HOLDERS_POOL_ADDR --send --recall-nonce

export VENUE_SC_ADDRESS=<deployed>
export CHAIN=mainnet
./scripts/verify_venue_codehash.sh
./scripts/rentpay_micro_test.sh   # PROXY mainnet + CHAIN=1
# Then GH secrets + Pages rebuild + announcement
```

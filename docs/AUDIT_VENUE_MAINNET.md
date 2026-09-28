# Audit · Venue-split → production mainnet

**Date reference:** 2026-09-28  
**Scope:** `contracts/venue_split` · front fail-closed · deploy/verify path  
**Status:** code ready · **NOT** deployed on mainnet · paper fail-closed default

---

## 1. Contract security review

| Check | Result | Notes |
|-------|--------|-------|
| Split bps sum = 10_000 | ✅ | 4000+2000+2500+1500 compile-time |
| No `setSplit` after init | ✅ | Economics immutable |
| No owner withdraw / sweep | ✅ | Only `setPaused` |
| Pause blocks new `rentPay` only | ✅ | No fund seizure |
| Dust → holders bucket | ✅ | Avoids locked remainder |
| Zero-address init rejected | ✅ | `require!(!addr.is_zero())` |
| EGLD + single fungible ESDT | ✅ | `rentPay` / `rentPayEsdt` |
| Upgrade endpoint | ⚠️ | Present for toolchain; **policy = do not upgrade after GO_LIVE** |
| Reentrancy | ✅ | Direct sends end of tx; no external calls before state |
| PEM in repo | ✅ | None |

### Residual risks (accept or mitigate)

| Risk | Severity | Mitigation |
|------|----------|------------|
| Wrong bucket addresses at init | P1 | Multi-sig review of 4 addresses before deploy |
| ESDT spoof (wrong token) | P2 | Document accepted token IDs; optional whitelist later |
| Pause key compromise | P2 | Owner = cold / multisig; pause only |
| Front sets CODEHASH_OK without verify | P1 | Ops checklist + this audit |

---

## 2. Front fail-closed

| Env | Role |
|-----|------|
| `VITE_VENUE_SC_ADDRESS` | SC bech32 (empty = no TX) |
| `VITE_VENUE_CODEHASH_OK` | `1` only after explorer + wasm match |

```ts
canRentVenueOnChain() === VENUE_LIVE && usable(VENUE_SC_ADDRESS)
```

- Default: **paper** (`rentPayPaper` → intent `VENUE_RENT_PAY`)
- Live TX only via `useVenueRentTx().rentPayLive` when both env set
- Never send to empty / known-empty placeholders

---

## 3. Verify codeHash (devnet)

```bash
# After deploy_venue_split_testnet.sh
export VENUE_SC_ADDRESS=erd1qqq…   # from deploy output
export CHAIN=devnet
./scripts/verify_venue_codehash.sh
```

Must print non-empty `codeHash`. Compare to local:

```bash
cd contracts/venue_split && mxpy contract build
# hash of output/*.wasm should match explorer (or documented CI artifact)
```

---

## 4. rentPay micro-test (devnet)

```bash
export VENUE_SC_ADDRESS=erd1qqq…
export SC_DEPLOYER_PEM=~/keys/deployer-devnet.pem
./scripts/rentpay_micro_test.sh   # 0.001 EGLD, tier=xartists
```

Verify:

1. TX success on devnet explorer  
2. Event `rentPaid`  
3. Balances of 4 buckets increased ~40/20/25/15  

---

## 5. GO_LIVE mainnet sequence

1. External audit sign-off (or internal dual review)  
2. Deploy mainnet with **final** 4 bucket addresses  
3. `./scripts/verify_venue_codehash.sh` CHAIN=mainnet  
4. Micro rentPay with dust EGLD  
5. Set GitHub secrets:  
   - `VITE_VENUE_SC_ADDRESS`  
   - `VITE_VENUE_CODEHASH_OK=1`  
6. Rebuild Pages · hard-refresh `#/venues`  
7. Public announcement  

**Do not** set CODEHASH_OK on mainnet Pages while only devnet is verified.

---

## 6. Production checklist (broader dApp)

| Item | Status |
|------|--------|
| Venue-split SC code | ✅ ready |
| Venue-split mainnet deploy | ❌ |
| Marketplace SC live | ❌ paper |
| Slot SC | ❌ paper |
| PEM out of front/Akash/git | ✅ policy |
| Vellum proxy (no key in browser) | ✅ service |
| Studio paper mint E2E | ✅ |
| Pulse fail-soft demo | ✅ |
| xPortal WC allowlist | ops |

---

## 7. Sign-off

| Role | Action |
|------|--------|
| Ops | Deploy testnet + paste address/codeHash in issue |
| Auditor | Confirm tables §1 |
| CEO | Authorize mainnet only after §5 steps 1–4 green |

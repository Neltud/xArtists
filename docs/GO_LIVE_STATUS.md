# GO_LIVE Status — venue-split & production

**Updated:** 2026-09-28 17:17 CEST  
**Rule:** paper fail-closed until codeHash verified on the **real** SC address.

---

## Sign-off audit §1

✅ APPROVED

---

## Checklist production

| # | Step | Status |
|---|------|--------|
| 1 | Audit §1 | ✅ DONE |
| 2 | Deploy mainnet (4 buckets) | 🟡 **buckets READY** · **wasm build BLOCKED** (toolchain) |
| 3 | verify codeHash mainnet | ❌ waiting SC |
| 4 | Micro rentPay dust | ❌ waiting SC |
| 5 | Secrets Pages + rebuild | ❌ no CODEHASH_OK yet |
| 6 | Annonce publique | ❌ after 2→5 |

---

## 4 bucket addresses (immutable at init)

| Bucket | % | Address |
|--------|---|---------|
| **Institution** | 40 | `erd1hurlzgn2sq8sswdksv7ewtp6vs9umdakcpef5nfxkmt7mpxsyumsywtva6` |
| **Associations** | 20 | `erd1cwp2m53pnem5p35vsdc2mcry6779eawq9h4ty2a4nnsp8ewknrjs55yxcd` |
| **LIA treasury** | 25 | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` |
| **Holders pool** | 15 | `erd1qpvy7z9jchrvxcu0c9z3w083am6n5j7nae8u0cvaanesa36a839qcgj5fz` |

PEMs (institution / associations / holders): **sandbox only**  
`/home/workdir/artifacts/venue-buckets/*.pem` — **never git / never front / never Akash**.

Deployer (funded **0.1 EGLD**):
`erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`

---

## Bloqueur actuel : build wasm

Sandbox: Rust 1.75 · `sc-meta` requires edition2024 · **cannot compile** venue-split here.

### Sur machine ops (Rust ≥ 1.85 ou toolchain MultiversX) :

```bash
export INSTITUTION_ADDR=erd1hurlzgn2sq8sswdksv7ewtp6vs9umdakcpef5nfxkmt7mpxsyumsywtva6
export ASSOCIATIONS_ADDR=erd1cwp2m53pnem5p35vsdc2mcry6779eawq9h4ty2a4nnsp8ewknrjs55yxcd
export LIA_TREASURY_ADDR=erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6
export HOLDERS_POOL_ADDR=erd1qpvy7z9jchrvxcu0c9z3w083am6n5j7nae8u0cvaanesa36a839qcgj5fz
export SC_DEPLOYER_PEM=/path/to/xartists-sc-deployer.pem

cd contracts/venue_split
mxpy contract build   # or sc-meta all build

mxpy contract deploy --bytecode=output/venue-split.wasm \
  --pem="$SC_DEPLOYER_PEM" --gas-limit=60000000 \
  --proxy=https://gateway.multiversx.com --chain=1 \
  --arguments \
    addr:$INSTITUTION_ADDR \
    addr:$ASSOCIATIONS_ADDR \
    addr:$LIA_TREASURY_ADDR \
    addr:$HOLDERS_POOL_ADDR \
  --send --recall-nonce

export VENUE_SC_ADDRESS=<deployed>
export CHAIN=mainnet
./scripts/verify_venue_codehash.sh
# then rentpay_micro_test with CHAIN=1 PROXY=https://gateway.multiversx.com
```

---

## Front

Paper **fail-closed** · no `VITE_VENUE_CODEHASH_OK` · no public SC announcement.

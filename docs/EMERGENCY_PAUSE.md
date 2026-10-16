# Emergency pause — xArtists mainnet SC

Use when `ops_sc_watch` fails, unexpected balance spike, or suspected exploit pattern
(see Kevin Lallement 2026-10-16 note on automated SC scanning).

## 1. Detect

```bash
python3 scripts/ops_sc_watch.py
# or GitHub Actions → Ops SC watch
```

Fail conditions: `MISMATCH` codeHash · `NULL` · balance ≥ alert (default 2 EGLD).

## 2. Pause on-chain (owner wallet only)

**Never** use dApp user Connect for this. Use mxpy / MultiversX Utils with **owner** PEM offline.

Priority order (public money surfaces first):

| Priority | SC | Address |
|----------|-----|--------|
| 1 | agents_marketplace | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` |
| 2 | nft_marketplace | `erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm` |
| 3 | slot_casino | `erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f` |
| 4 | agent_stake_escrow | `erd1qqqqqqqqqqqqqpgqzyvwldu6jq8w6ry6s856dl0uy7g0v37vvhxqndvzr3` |
| 5 | others | see `contracts.ts` |

```bash
SC=erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg

mxpy contract call "$SC" \
  --function=setPaused \
  --arguments true \
  --pem=/secure/path/owner.pem \
  --proxy=https://gateway.multiversx.com \
  --chain=1 \
  --gas-limit=10000000 \
  --recall-nonce \
  --send
```

Verify view `isPaused` → `true` on explorer or:

```bash
mxpy contract query "$SC" --function=isPaused --proxy=https://gateway.multiversx.com
```

## 3. Gate dApp OFF

Until codeHash re-verified:

- Set GitHub Actions secrets / env: `VITE_AGENTS_CODEHASH_OK=0`, `VITE_MARKETPLACE_CODEHASH_OK=0`, etc.
- Redeploy Pages so `canBuyAgent()` / `canListBuyNft()` stay closed.

## 4. Do not

- Do not `claimFees` during an active incident unless isolating funds to a known safe cold wallet with dual review.
- Do not upgrade SC mid-incident without a known-good wasm + hash plan.
- Do not post PEM or seed anywhere.

## 5. Resume

1. Root cause documented.
2. `ops_sc_watch.py` green.
3. `setPaused false` per SC.
4. Re-enable `VITE_*_CODEHASH_OK` only after hash match.

Owner (2026-10-16 probe): `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`

# GO_LIVE Status — 1 octobre 2026

Tous les SC produit sont **LIVE** (codeHash explorer). LIA trading reste paper.

| Step | Status |
|------|--------|
| 1 Deploy mainnet (venue / market / agents / staking / slot / treasury / gov / escrow) | ✅ LIVE |
| 2 Adresses | `data/contracts.json` |
| 3 codeHash on-chain | ✅ 10/10 non-null (probe 1 oct) |
| 4 Slot house | ✅ 0.5 EGLD |
| 5 Runtime explorer unlock (sans secret Pages) | ✅ `runtimeCodehash` v3 |
| 6 `VITE_*_CODEHASH_OK` commité | ❌ interdit — runtime suffit |
| 7 Dust user TX (stake / list / spin REAL) | ⏳ **à faire** — preuve produit |
| 8 `LIA_LIVE_TRADING=1` | ❌ paper |
| 9 MX-8004 First 100 | ⏳ inscription LIA |
| 10 Treasury dest wallets | ⏳ ops (PR #87) |

Explorer slot: https://explorer.multiversx.com/accounts/erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f

## Front policy

- Address known + explorer hash match → UI **Ouvert**
- `can*()` = address utilisable **et** (env flag **ou** runtime match)
- LIA ops wallet ≠ user wallet
- Safety switch → paper sur échec TX

# GrokyversX × Hatom

## Capabilities (target)

| Action | Status |
|--------|--------|
| Supply / lend (mint hToken) | **Routed** — failed live on HTM: **market liquidity cap** |
| Withdraw (redeem) | Spec ready |
| Enter market as collateral | Spec ready (controller) |
| Borrow | Spec ready — **needs collateral + borrow power** |
| Repay | Spec ready |
| HTM Booster stake | Address discovery — do not send blind |

## Live attempt (2026-09-12)

- Wallet: `erd12c7f9…qq5gl`
- Tried: `mint` ~0.74 HTM → HTM Money Market
- TX `d3bc805e…8857` / `c39a63d9…ef33` → **fail**
- SC error: **`reached market liquidity cap`** (`mintAllowed`)
- HTM market is **full** — cannot supply more HTM until cap rises / withdrawals

## Borrow reality (micro wallet)

With ~1.5 HTM + ~0.23 EGLD and **no** open collateral position:
- Borrow will **revert**
- Do **not** loop leverage on dust equity

## Replace Vellum / LIA?

| Layer | GrokyversX | LIA | Vellum |
|-------|------------|-----|--------|
| Sign mainnet TX (swap, transfer, Hatom) | **Yes** | Ops wallet separate | No (orchestration) |
| Board paper / packs narrative / demo UI | Partial | **Product brain** | Publish cycles |
| Full dApp UX | No — uses repo front | Signals in UI | CI / secrets |

**GrokyversX does not erase LIA** as the product agent identity. It **extends** execution (DEX + DeFi). Vellum is optional for Grok trading; still useful for multi-step board publish.

## Next when HTM cap opens

```text
ESDTTransfer@HTM-f51d55@{amount}@mint → HTM market
enterMarkets@{htmMarket} → controller  # if collateral
borrow@{amount} → other market         # only if CF allows
```

Gas for mint observed success on chain: **≥ 34M** gasLimit.

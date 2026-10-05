# P0 — Calldata layer (Brain → Guardian bridge)

## Problem (audit R1/R2)

- Decision engine produced **Intent** (paper).
- UniversalExecutor needs **`data` / `data_hex`** strings.
- No constructor → no safe autonomous swap.

## Solution

Package `lia/calldata/`:

| Module | Builds |
|--------|--------|
| `esdt.py` | `ESDTTransfer@token@amount` |
| `swap.py` | `wrapEgld`, `ESDTTransfer+swapTokensFixedInput`, **dust EGLD→USDC plan** |

## Usage

```bash
PYTHONPATH=. python -m lia.calldata.swap
# → JSON plan with 2 steps (wrap + swap)
```

Guardian path (conceptual):

1. `plan = dust_egld_to_usdc_plan(amount_egld=0.001, min_usdc=<quote>)`
2. For each step: `UniversalExecutor.sign_and_send(receiver=..., value=..., data=...)`
3. Only if `LIA_LIVE_TRADING=1` + allowlist + caps

## Safety

- Does **not** enable live trading by itself
- Router / WEGLD addresses must be re-verified on explorer before first LIVE dust
- `min_out=0` forbidden in Beta live policy (ops must inject quote)

## Next

- Quote client (xExchange price) → fill `min_usdc`
- Wire plan runner behind allowlist in `lia.beta`

# MICRO-PROOF SWAP LIVE (Strike bridge)

**LIA_LIVE_TRADING = 0** — human dust only, not agent auto-trade.

## Path

1. **wrapEgld** 0.001 EGLD → WEGLD  
   TX: `b843b2cc76d081a87499746ff01cf245344886411c855b8302f1a874ea707538` · **success**
2. **swapTokensFixedInput** WEGLD → USDC on xExchange pair  
   TX: `c45847d433089839357edff157251b54c554abeacd548600f3b2ea09b5e25bd7` · **success**

| Field | Value |
|-------|--------|
| Pair | `erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq` (WEGLD/USDC via router getPair) |
| In | 0.001 WEGLD |
| Out | **0.00418 USDC** |
| min_out | 4000 atomic (≈2% slip buffer vs quote) |
| Explorer swap | https://explorer.multiversx.com/transactions/c45847d433089839357edff157251b54c554abeacd548600f3b2ea09b5e25bd7 |

## Calldata lesson

Endpoint name in multi-arg `ESDTTransfer` must be **hex of ASCII**:

```
ESDTTransfer@WEGLD_hex@amount@73776170546f6b656e734669786564496e707574@USDC_hex@min_out
```

Plain `swapTokensFixedInput` string → fail. Hex form → success.

## Dry-run line (reference)

```
[DRY-RUN] Swap EGLD → USDC | Data: ESDTTransfer@5745…@7377…@5553…@0fa0 | Min_Out: 4000 atomic USDC
```

## Safety

- Dust only (0.001 EGLD)
- Does not set `LIA_LIVE_TRADING=1`
- Beta still requires allowlist + caps + kill-switch ROE

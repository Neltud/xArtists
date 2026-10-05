# P1 — Intent feed + calldata dry-run

## Intent feed loop

1. `python -m lia.shadow.sprint` writes `data/lia_intent_feed.json`
2. Shape matches front: `action`, `assetId`, `amount`, `confidence`, `at`, `paper`
3. UI `IntentFeedTerminal` loads **server** feed + local + shadow export
4. Every line prefixed **`[SIMULATED]`**

## Dry-run swap

```bash
PYTHONPATH=. python -m lia.calldata.dry_run --egld 0.001 --slippage-bps 100
```

- Fetches EGLD USD from MultiversX economics
- `min_usdc = amount_egld * egld_usd * (1 - slippage)`
- Injects min_out into `swapTokensFixedInput` arg (nonzero)
- Logs `swap_data_string`, `swap_data_hex`, TRO ESDT dust template
- **No broadcast**, `LIA_LIVE_TRADING=0`

## Next (real ESDT dust)

Requires deployer token balance ≥ 0.0001 TRO or USDC, then:

```bash
PYTHONPATH=. python -m lia.deployer.micro_esdt_proof --token TRO-94c925 --amount 0.0001 --send
```

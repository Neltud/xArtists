# MICRO-PROOF ESDT LIVE (Atom test)

**LIA_LIVE_TRADING = 0** — capability proof only (not agent auto-trade).

## Result

| Field | Value |
|-------|--------|
| Status | **success** |
| Function | `ESDTTransfer` |
| Token | `TRO-94c925` |
| Amount | **0.0001 TRO** (100 atomic, **6 decimals**) |
| TX | `1b56321b6b3cf942b82b8b434378bfe320309b6a45330b5d54f8e477e722444f` |
| Explorer | https://explorer.multiversx.com/transactions/1b56321b6b3cf942b82b8b434378bfe320309b6a45330b5d54f8e477e722444f |
| Sender/Receiver | deployer self-transfer |

## Failure then fix

First attempt used **18 decimals** → VM `insufficient funds`.  
TRO is **6 decimals**. Retry with `--decimals 6` → success.

```bash
PYTHONPATH=. python -m lia.deployer.micro_esdt_proof \
  --token TRO-94c925 --amount 0.0001 --decimals 6 --send
```

## Safety

- Dust only
- Human-launched PEM path
- Does not enable `LIA_LIVE_TRADING`

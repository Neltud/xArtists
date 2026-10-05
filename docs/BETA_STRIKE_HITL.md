# Beta Strike — Human-in-the-Loop

```bash
PYTHONPATH=. python -m lia.guardian.strike_deployer --preflight-only
PYTHONPATH=. python -m lia.guardian.strike_deployer --propose --slots 5
LIA_LIVE_TRADING=1 PYTHONPATH=. python -m lia.guardian.strike_deployer --execute-proposal prop_xxx
PYTHONPATH=. python -m lia.guardian.strike_deployer --mark-executed prop_xxx <txHash>
PYTHONPATH=. python -m lia.brain.post_trade
PYTHONPATH=. python -m lia.guardian.kill_switch
```

## First Blood (already on-chain)

1. TRO ESDT `1b56321b…`
2. wrapEgld `b843b2cc…`
3. WEGLD→USDC `c45847d4…`

## Black Swan

EGLD drop ≥ 8% / 15 min → `BLACK_SWAN` kill-switch.

# Beta Strike — Human-in-the-Loop

## Flow

```
Brain intent → strike_deployer --propose
            → human reviews strike_proposals.json
            → LIA_LIVE_TRADING=1 + --execute-proposal <id>
            → ops runs UniversalExecutor / dust swap
            → --mark-executed <id> <txHash>
            → post_trade → performance_delta → orchestrator weights
```

## Commands

```bash
PYTHONPATH=. python -m lia.guardian.strike_deployer --preflight-only
PYTHONPATH=. python -m lia.guardian.strike_deployer --propose --slots 5
PYTHONPATH=. python -m lia.guardian.strike_deployer --list
# After ops approval:
LIA_LIVE_TRADING=1 PYTHONPATH=. python -m lia.guardian.strike_deployer --execute-proposal prop_xxx
PYTHONPATH=. python -m lia.guardian.strike_deployer --mark-executed prop_xxx <txHash>
PYTHONPATH=. python -m lia.brain.post_trade
PYTHONPATH=. python -m lia.guardian.kill_switch   # flash-crash tick
```

## Zero-day dust already on chain (First Blood foundation)

| # | Action | TX |
|---|--------|-----|
| 1 | TRO ESDT dust | `1b56321b…22444f` |
| 2 | wrapEgld 0.001 | `b843b2cc…07538` |
| 3 | WEGLD→USDC swap | `c45847d4…25bd7` |

Slots 4–5: propose via CLI when ready (still HITL).

## Black Swan

`check_flash_crash()`: EGLD drop ≥ **8%** in **15 min** → kill-switch `BLACK_SWAN`, `LIA_LIVE_TRADING=0`, UI `kill_switch.json`.

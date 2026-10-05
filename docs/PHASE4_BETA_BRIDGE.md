# Phase 4 — Live data bridge (not auto-trading)

## Principles

1. **Shadow remains default** — instant fallback.
2. **`lia_live_status.json`** = on-chain snapshot (balances, TX).
3. **UI Live mode** = display real balances/TX; does **not** flip `LIA_LIVE_TRADING`.
4. **Strike deployer** = preflight + plan; broadcast only with env + ops confirm + future executor wiring.

## Commands

```bash
PYTHONPATH=. python -m lia.guardian.onchain_monitor
PYTHONPATH=. python -m lia.guardian.strike_deployer
PYTHONPATH=. python -m lia.brain.post_trade
```

## Proven dust (already on mainnet)

| Action | TX |
|--------|-----|
| TRO ESDT | `1b56321b…` |
| wrapEgld | `b843b2cc…` |
| WEGLD→USDC | `c45847d4…` |

## Safety

Do not set `LIA_LIVE_TRADING=1` until ops checklist: kill-switch clear, YAML signed, PEM vault, first 5 slots human-gated.

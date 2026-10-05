# Genesis Protocol (Phase 6) — Master position

## Authority

1. **Operator (you)** decides live capital.
2. **Grok/implementation** keeps gates, HITL, honest labels.
3. **Gemini prompts** = inspiration only — not auto-executed claims like “no more simulations” or forced `LIA_LIVE_TRADING=1`.

## What is unified

| Layer | Module |
|-------|--------|
| Pulse | `python -m lia.genesis.tick` |
| Economy plans | `lia.calldata.tro_economic` (reward / burn **plans**) |
| UI | `GenesisCockpit` tabs: Trading · RWA · Economy · Audit |
| NFT rule | `agent_constraints` — LIA never holds NFT |

## What is still HITL / paper

- TRO +1 / burn −1 **ledger** until ops signs ESDT TX and marks hash in audit.
- No auto-broadcast from genesis tick.
- Shadow UI default; Live display ≠ live trading.

## Production path (ops)

1. `genesis.tick` on cron (monitor only).
2. Mint confirm → reward plan → **human sign** 1 TRO.
3. Ship confirm → burn plan → **human sign** 1 TRO to burn sink.
4. `economic_validator` after each marked TX.
5. Only then consider `LIA_LIVE_TRADING=1` for token dust under Beta Strike.

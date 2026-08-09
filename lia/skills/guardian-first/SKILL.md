---
name: lia-guardian-first
description: Enforce Guardian before any compound or size-up in LIA cycles.
---

# Guardian first

## Rule

`check_before_open` / `guardian_gate` **before** compound open, TradingStack size-up, or live executor.

## Triggers for block

- Mode DEFENSE / RISK_OFF
- Drawdown ≥ 12%
- Spiral score / leverage over policy (`lia/guardian/spiral.py`)
- `LIA_LIVE_TRADING=0` → no PEM send regardless of allow

## Desk debate

`lia.circuit.desk_debate.debate` may suggest BUY; **risk_veto** or Guardian still wins.

## After blocked

Prefer YIELD / Hatom snapshot / HOLD — never force BUY.

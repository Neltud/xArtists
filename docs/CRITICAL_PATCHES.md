# CRITICAL patches (post red-team)

| ID | Fix |
|----|-----|
| Double-burn | `record_burn` / `record_mint` idempotent via `burned_work_ids` / `minted_work_ids` |
| NFT bypass | `calldata_guard.inspect_tx_data` before sign; token extracted for `enforce` |
| Silent losses | `record_trade_result(loss_usd=, gas_egld=)` on every final TX; daily gas budget 0.02 EGLD |
| Halt | File-backed `risk_enforcer_state.halt` (cross-process) |

Scale capital only after these are live in the worker you actually run.

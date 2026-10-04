# UniversalExecutor audit (point-in-time)

**File:** `lia/executor/universal_executor.py`  
**Date context:** Beta runbook alignment

## Capabilities

1. **sign_and_send(receiver, value, data, gas_limit)**  
   - Core primitive. Builds MultiversX `Transaction`, signs with PEM, sends via `ProxyNetworkProvider`.  
   - `data` = **plain string** encoded to bytes (not pre-hexed full payload builder for swaps).

2. **micro_swap_test_egld_self(amount_wei)**  
   - Name is historical: it is an **EGLD self-transfer**, not a DEX swap.  
   - Proves nonce + PEM + gateway. Ideal Beta micro-proof.

3. **execute_swap(router, token_in, token_out, amount_in, min_out, data_hex)**  
   - Does **not** compute routes.  
   - Forwards `data_hex` to `router`. **Caller must supply correct swap data.**  
   - Must be wrapped with `lia.beta.allowlist` before use.

4. **redistribute_tro(amount_atomic)**  
   - Builds `ESDTTransfer@<token_hex>@<amount_hex>` per `asset_policy` intents.  
   - Fails soft if `lia.policy.asset_policy` missing.

5. **health()**  
   - `live`, `pem_configured`, circuit breaker, API/proxy URLs, policy string.

## Safety already present

- `LIA_LIVE_TRADING!=1` → dry-run (no broadcast)
- Missing PEM → refuse load on live path
- CircuitBreaker: 5 failures → 300s block

## Safety missing (Beta adds in policy layer)

- Token allowlist (added: `lia/beta/allowlist.py`)
- USD / daily caps (same module)
- Automatic DEX calldata builder
- On-chain kill-switch SC (ops process only for now)

## Recommendation

Use **only** `micro_swap_test_egld_self` for first live proof.  
Do not call `execute_swap` until calldata is human-reviewed and tokens are allowlisted.

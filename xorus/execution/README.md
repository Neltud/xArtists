# xOrus · Execution (OneDex MCP)

**Mode default : assisted (human-in-the-loop).**

OneDex MCP provides quotes + **unsigned** transactions.  
xOrus adds policy gates + mandatory simulation.  
No private key ever enters this package.

## Endpoint

```
POST https://aggregator.onedex.app/ai/mcp
```

No API key. Mainnet only.

## Production path (required)

Browser **must not** call OneDex MCP directly.

```
Front → POST {VITE_ACCESS_API_BASE}/v1/xorus/assisted-swap
     → access-api (policy + MCP server-side)
     → signingLink only if simulation strictly OK
```

Module: `services/access-api/src/xorusAssistedSwap.mjs`  
Python mirror: `xorus/execution/policy.py` + `assisted.py`

## Tools used

| Tool | Usage in assisted flow |
|------|------------------------|
| get_quote | Preview cost, minOut, warnings |
| build_swap_tx | Unsigned tx + signingLink |
| simulate_swap_tx | Mandatory dry-run before proposing signature |
| list_tokens / get_wallet_balances | Optional helpers |
| tx_status | Post-broadcast tracking (caller responsibility) |

## Quick start (Python assisted)

```python
from xorus.execution import SwapIntent, run_assisted

intent = SwapIntent(
    token_in="EGLD",
    token_out="ONE",
    amount_in="0.1",
    sender="erd1...your_public_address...",
)

outcome = run_assisted(intent)

if outcome.stage == "ready_to_sign":
    print(outcome.message)
elif outcome.stage == "blocked":
    print("Policy:", outcome.message)
else:
    print(outcome.stage, outcome.message)
```

## Policy (hard limits)

Edit `policy.py` **and** keep `xorusAssistedSwap.mjs` in sync:

- `ALLOWED_TOKENS` — **exact match only**
- `MAX_AMOUNT_IN`
- `MAX_SLIPPAGE_BPS`

Amounts must be finite numbers > 0 (NaN / Inf / ≤0 rejected).

## Safety contract

- `executable=False` remains the global default in `xorus.safety`.
- This package never signs and never broadcasts.
- Receiver is enforced by OneDex (aggregator contract).
- Simulation must pass **and** `meetsMinOut` must be explicitly `true` before a signing link is proposed.
- Autonomous mode is **not** implemented.

## Audit hardening

- Strict token allowlist (no prefix matching).
- Numeric amount hygiene.
- Frontend + backend: signing link only when `simOk === true`.
- **Client bypass closed**: MCP only from access-api proxy.

## Next steps

1. Deploy access-api with the new route (ops).
2. Ensure `VITE_ACCESS_API_BASE` points at that deployment for Pages builds.
3. Later: autonomous path behind explicit flag + dedicated agent wallet + daily budget ledger.

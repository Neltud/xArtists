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

## Tools used

| Tool | Usage in assisted flow |
|------|------------------------|
| get_quote | Preview cost, minOut, warnings |
| build_swap_tx | Unsigned tx + signingLink |
| simulate_swap_tx | Mandatory dry-run before proposing signature |
| list_tokens / get_wallet_balances | Optional helpers |
| tx_status | Post-broadcast tracking (caller responsibility) |

## Quick start (assisted)

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
    # Open outcome.build.signing_link in a wallet, verify, sign.
elif outcome.stage == "blocked":
    print("Policy:", outcome.message)
else:
    print(outcome.stage, outcome.message)
```

## Policy (hard limits)

Edit `policy.py`:

- `ALLOWED_TOKENS` — **exact match only** (ticker or full identifier)
- `MAX_AMOUNT_IN`
- `MAX_SLIPPAGE_BPS`
- `DAILY_BUDGET_USD` (placeholder for later metering)

Amounts must be finite numbers > 0 (NaN / Inf / ≤0 rejected).

## Safety contract

- `executable=False` remains the global default in `xorus.safety`.
- This package never signs and never broadcasts.
- Receiver is enforced by OneDex (aggregator contract).
- Simulation must pass **and** `meetsMinOut` must be explicitly `true` before a signing link is proposed.
- Autonomous mode is **not** implemented in this first drop.

## Audit hardening (2026-11-17)

- Strict token allowlist (no prefix matching).
- Numeric amount hygiene (finite, > 0).
- Frontend + backend: signing link only when `simOk === true`.
- Frontend currently calls OneDex MCP directly (beta). A policy-aware backend proxy is the next step before production financial use.

## Next steps

1. Backend proxy endpoint that applies `check_intent` then MCP (close client bypass).
2. Wire into decision_agent / swarm as an optional execution path.
3. Later: autonomous path behind explicit flag + dedicated agent wallet + daily budget ledger.

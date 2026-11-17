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

- `ALLOWED_TOKENS`
- `MAX_AMOUNT_IN`
- `MAX_SLIPPAGE_BPS`
- `DAILY_BUDGET_USD` (placeholder for later metering)

## Safety contract

- `executable=False` remains the global default in `xorus.safety`.
- This package never signs and never broadcasts.
- Receiver is enforced by OneDex (aggregator contract).
- Simulation must pass before a signing link is returned.
- Autonomous mode is **not** implemented in this first drop.

## Next steps

1. Wire into decision_agent / swarm as an optional execution path.
2. Front: display signingLink + costSummary + warnings.
3. Later: autonomous path behind explicit flag + dedicated agent wallet + daily budget ledger.

## Controls and residual blockers — Nov 17, 2026

- Only exact token symbols are accepted in the beta input policy; names or
  token-ID prefixes are **not** evidence of a verified on-chain asset.
  Switch to verified full token identifiers before production approval.
- Amounts use Python `Decimal` (finite, strictly positive, token-specific cap).
- Quoted human-readable `minOut` must prove the requested slippage cap;
  the built raw minimum must not worsen versus the quoted raw minimum.
- `meetsMinOut` must be the actual JSON boolean `true`, not absent or a string.
- The signing link must be HTTPS on `wallet.multiversx.com/hook/transaction`.
- If any required proof is missing, return `blocked`; no signing URL is approved.
- Tests: `python -m unittest tests.test_xorus_execution` (offline mocks only).
- **Production NO-GO:** the React beta still calls OneDex directly and has
  browser-side checks, not server-enforced policy. A server-owned `run_assisted`
  API route, authenticated session/rate limits, contract/token-ID validation,
  on-chain amount checks and real-wallet browser smoke tests are still required.
- `DAILY_BUDGET_USD` is not metered. Autonomous mode stays disabled.
- Neither OneDex nor xOrus signature-free simulation guarantees on-chain
  execution, quoted price, or wallet safety. Review recipient/data and amounts.

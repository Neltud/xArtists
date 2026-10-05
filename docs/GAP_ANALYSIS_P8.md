# Phase 8 — Gap analysis & hard locks

## Golden thread (runtime)

**PASS** — RWA reassess → orchestrator → proposal (broadcast=false) → performance → yield compliance → mint/burn integrity.

## Data flow checklist

| From | To | Status |
|------|-----|--------|
| `rwa_evaluator` | orchestrator (via genesis/decision sentiment) | OK |
| decision_chain | `decision_proposals.json` + UI ProposedActions | OK |
| shadow / RWA | `performance_tracker` | OK |
| yield_distributor | `managed_balances` + PortfolioWealth | OK |
| kill_switch | `kill_switch.json` (UI can poll) | OK |
| post_trade | performance_delta → sizing/orchestrator weights | OK |
| economic_validator | EconomicPulse ledger | OK |

## Hard locks

| Lock | Result |
|------|--------|
| LIA trades NFT | **ABORT_TRADE** |
| Broadcast with `LIA_LIVE_TRADING=0` | **blocked** |
| Ghost profit (user > market+RWA) | **compliance fail** |
| Flash crash 8%/15m | **BLACK_SWAN** kill |

## Known gaps (honest)

- App.tsx routes `/history` `/admin` `/rwa` may need manual wire if not merged
- TRO reward/burn **plans** only until ops signs ESDT
- Pack equity is **attribution**, not custodial on-chain sub-accounts
- GitHub Pages cannot host `/api/approve` server

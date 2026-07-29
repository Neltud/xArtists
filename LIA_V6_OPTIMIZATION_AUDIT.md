# LIA v6 Workflow Optimization Audit
**Date:** 2026-07-29 | **Auditor:** Gz | **Repo:** Neltud/xArtists @ v0.14.0

---

## Executive Summary

LIA v6 is a 62-node Vellum Workflow running autonomous DeFi trading on MultiversX mainnet. The architecture is well-designed (parallel data collection, 5 AI brains, 6 executors, multi-channel reporting), but several core components are **stubs or incomplete**, and the trading logic is **pure rule-based** despite "AI brain" naming. There are clear, actionable optimizations across workflow structure, trading logic, execution, and data integration.

**Priority ranking:** P0 (critical/stub) > P1 (high impact) > P2 (improvement) > P3 (nice-to-have)

---

## 1. Workflow Architecture (Vellum Workflows)

### P0 — Cron Discrepancy
- **Issue:** Tech docs say "ToutesLes30Minutes" but cron is `0 */1 * * *` (every hour at minute 0), not every 30 min.
- **Fix:** If 30-min cadence is intended: `0 */30 * * *` or `*/30 * * * *`. If hourly is intended, update docs.
- **Impact:** Trading frequency is half what's documented. Missed opportunities in scalping (TP1).

### P1 — 6 Unused Nodes
- **Issue:** `lia_v6_status.json` reports `nodes_unused: 6` out of 68 total.
- **Fix:** Remove dead nodes or activate them. Dead nodes add latency, complexity, and Vellum compute cost.
- **Action:** Inspect the Vellum Workflows UI to identify the 6 unused nodes and either wire them or delete them.

### P2 — OrchestratorRouter Optimization
- **Issue:** Router uses static routing (TRADE/STRONG_BUY/YIELD_ONLY/BLOCKED). No dynamic allocation based on market regime.
- **Fix:** Add a regime detector node (risk-on/risk-off from GreenSmoke Macro agent) upstream of the router. Route to YIELD_ONLY during risk-off, full TRADE during risk-on.
- **Impact:** Capital preservation during downturns, aggressive deployment during uptrends.

---

## 2. Trading Brain (`nodes/universal_brain_unified.py`)

### P0 — Fragile Input Pattern
- **Issue:** All inputs use `getattr(self, "egld_balance", 0)` pattern instead of proper Vellum node input descriptors. No type safety, no validation, silent defaults on missing data.
- **Fix:** Use Vellum's `BaseNode` input descriptors:
  ```python
  class UniversalBrainUnified(BaseNode):
      egld_balance: float
      usdc_balance: float
      total_portfolio_usd: float
      hatom_health_factor: float
      # ... etc
  ```
- **Impact:** Silent failures when upstream nodes don't emit expected fields. Could trade on stale/zero data.

### P1 — No Volatility-Based Position Sizing
- **Issue:** Budget allocation is static 32% per brain. Position size doesn't scale with confidence or volatility.
- **Fix:** Implement Kelly fraction or volatility-scaled sizing:
  ```python
  # ATR-based sizing
  atr_pct = token.get("atr_14_pct", 5.0)
  kelly_fraction = min(0.25, (confidence / 100) * (1 / atr_pct))
  budget_per_token = allocated_budget * kelly_fraction
  ```
- **Impact:** Larger positions on high-confidence/low-volatility setups, smaller on uncertain ones.

### P1 — No Correlation Check
- **Issue:** `max_tokens_to_buy = 3` but no check if selected tokens are correlated. Could buy 3 EGLD-pegged tokens = 3x EGLD exposure.
- **Fix:** Add correlation matrix check. Reject tokens with >0.7 correlation to already-selected tokens.

### P1 — Fixed TP/SL (No Trailing Stops)
- **Issue:** TP/SL are fixed percentages. No trailing stop to lock in profits on strong moves.
- **Fix:** Implement trailing stop logic:
  ```python
  # After entry, track highest price since entry
  highest_since_entry = max(token.get("highest_since_entry", current_price), current_price)
  trailing_stop = highest_since_entry * (1 - self.sl_default_pct / 100)
  if current_price <= trailing_stop and roi > 0:
      # Trigger trailing stop exit
  ```

### P2 — Flat Fee Estimation
- **Issue:** Fees are hardcoded: `dex_fee_per_hop = 0.003`, `gas_cost_usd = 0.05`, `max_slippage_pct = 0.03`.
- **Fix:** Fetch real-time gas price from MultiversX API, actual DEX fees from xExchange/AshSwap, and estimate slippage from pool depth.

### P2 — GreenSmoke Signals Not Integrated
- **Issue:** GreenSmoke forecasts (`greensmoke_forecasts.json`) contain actionable signals (Lia: ACCUMULATE EGLD, BUY BTC; Macro: RISK_ON) but the brain code never reads them.
- **Fix:** Add a GreenSmoke signal consumer node that feeds directional bias into the brains:
  ```python
  gs_signal = getattr(self, "greensmoke_signal", "NEUTRAL")
  if gs_signal == "ACCUMULATE" and decision == "WAIT":
      # Lower entry threshold, allow moderate-conviction buys
  elif gs_signal == "RISK_OFF" and decision == "BUY":
      # Override to WAIT
  ```

### P3 — No Actual ML/AI
- **Issue:** Despite "AI brain" naming, the logic is pure rule-based (RSI thresholds, composite scores, fixed thresholds). No model inference.
- **Fix:** Consider adding a Vellum LLM node for sentiment analysis from news/social, or a simple regression model for price prediction. The "AI" should at minimum be an LLM that reads market context and adjusts parameters.

---

## 3. Executor (`nodes/universal_executor.py`)

### P0 — Complete Stub
- **Issue:** The executor is a shell. `execute_workflow` body is `pass`. No actual trade execution.
- **Fix:** Implement full execution logic:
  - Build MultiversX transaction with proper gas estimation
  - Submit via `multiversx_sdk` (already imported in custom nodes)
  - Wait for transaction confirmation
  - Emit execution result (success/fail, gas used, actual slippage)
  - Update avg entry prices on success
- **Impact:** Without this, LIA cannot actually trade. All "BUY/SELL" decisions are paper trades.

### P1 — No MEV/Front-Running Protection
- **Issue:** No slippage protection, no private mempool routing.
- **Fix:** Set conservative `max_slippage` on swaps, use MultiversX's built-in adaptive gas, consider splitting large orders across time.

### P1 — No Circuit Breaker
- **Issue:** Retry logic exists but no circuit breaker to stop after consecutive failures.
- **Fix:** Add a failure counter. After 3 consecutive execution failures, halt trading and alert via Telegram.

---

## 4. Custom MX Nodes (`nodes/custom_mx_contract_nodes.py`)

### P0 — Minimal Implementation
- **Issue:** Only implements `query_nft_staking` with basic error handling. No TRO staking, BTC bridge, NFT minter, or marketplace interaction nodes.
- **Fix:** Implement nodes for:
  - `query_tro_staking` (stake/unstake/vote/claimRewards)
  - `query_marketplace` (listNft/buyNft/cancelListing)
  - `query_nft_minter` (mint/burn)
  - Add caching layer for read-only queries (avoid redundant API calls)

### P1 — No Caching
- **Issue:** Every query hits the MultiversX API directly. No caching for repeated queries within a workflow run.
- **Fix:** Add in-memory cache with TTL:
  ```python
  from functools import lru_cache
  @lru_cache(maxsize=128)
  async def cached_query(self, contract, function, args_tuple):
      ...
  ```

---

## 5. Workflow Inputs (`inputs.py`)

### P0 — Empty Inputs Class
- **Issue:** `Inputs(BaseInputs)` with `pass`. No structured workflow inputs defined.
- **Fix:** Define all inputs that the workflow should accept:
  ```python
  class Inputs(BaseInputs):
      wallet_address: str
      egld_price_ref: float
      avg_entry_egld: float
      avg_entry_wbtc: float
      avg_entry_wtao: float
      avg_entry_tro: float
      force_mode: str  # "auto" | "paper" | "live"
  ```

---

## 6. Frontend & CI/CD

### P1 — Redundant Deploy Workflows
- **Issue:** 5 GitHub Actions workflows for deployment: `deploy-pages.yml`, `deploy-frontend.yml`, `deploy-exclusive.yml`, `pages.yml`, `static.yml`, `jekyll-gh-pages.yml`. Overlapping triggers.
- **Fix:** Consolidate into 1-2 workflows. Keep `deploy-pages.yml` (most complete) and remove the rest.

### P1 — BigInt Precision Loss
- **Issue:** `onchain.ts` line 129: `Number(reserves.reserveToken.toString())` — JavaScript `Number` loses precision for values > 2^53. MultiversX reserves can be very large.
- **Fix:** Use `BigInt` arithmetic throughout, or convert to `Number` only after dividing by decimals.

### P2 — Guess-Based Contract Queries
- **Issue:** `tryQueryReserves` tries 6 function names blindly (`getReserves`, `get_reserves`, `getPoolState`, etc.). Wastes API calls.
- **Fix:** Use the known ABIs from `packages/core/src/contracts/index.ts` to call the correct function directly.

### P2 — Deploy Commits Directly to Main
- **Issue:** `deploy-pages.yml` commits build artifacts directly to `main`. No review step.
- **Fix:** Consider a `gh-pages` branch for deployment artifacts, or use GitHub Actions artifacts without committing to main.

---

## 7. Data & Reporting

### P1 — Stale Status Data
- **Issue:** `lia_v6_status.json` timestamp is `2026-07-23` (6 days old). GitHubReporter node should update this every run.
- **Fix:** Verify the GitHubReporter node is writing to `data/lia_v6_status.json` on each workflow execution. If it's writing elsewhere, update the path.

### P1 — No Performance Metrics
- **Issue:** No winrate, Sharpe ratio, max drawdown, profit factor, or trade history tracked.
- **Fix:** Add a `PerformanceTracker` node that:
  - Logs every trade (entry/exit, P&L, fees paid)
  - Computes rolling winrate (last 50 trades)
  - Tracks max drawdown
  - Writes to `data/lia_performance.json`
  - Surface on the dashboard Portfolio page

---

## 8. Strategy-Level Improvements

### P1 — GreenSmoke Integration
- **Issue:** GreenSmoke has 6 agents producing signals (Lia: crypto, Macro: regime, Liia: weather, etc.). Only Lia and Macro are relevant to trading. Their signals are stored in JSON but never consumed by LIA's brains.
- **Fix:** Add a `GreenSmokeConsumer` node between Phase 2 (data collection) and Phase 4 (brains):
  ```
  Phase 2 >> GreenSmokeConsumer >> Phase 4 (brains receive gs_bias, gs_confidence, gs_regime)
  ```

### P1 — Contrarian Brain Missing Code
- **Issue:** `ContrarianBrain` is listed as active but no implementation exists in `nodes/`.
- **Fix:** Implement contrarian logic: buy when RSI < 30 + extreme fear + price below VWAP, with 4% budget cap as documented.

### P2 — Dynamic Budget Allocation
- **Issue:** TP1/TP3/TP5 each get 32%. LIABrain gets 100%. No dynamic adjustment.
- **Fix:** Allocate based on recent performance:
  ```python
  # Winrate-weighted allocation
  tp1_wr = get_winrate("TP1", window=50)
  tp3_wr = get_winrate("TP3", window=50)
  tp5_wr = get_winrate("TP5", window=50)
  total_wr = tp1_wr + tp3_wr + tp5_wr
  tp1_budget = total_budget * (tp1_wr / total_wr) * 0.96  # 4% to contrarian
  ```

---

## Optimization Priority Matrix

| Priority | Item | Effort | Impact |
|---|---|---|---|
| P0 | Implement executor (currently stub) | High | Critical — enables actual trading |
| P0 | Fix input pattern (getattr → typed) | Medium | High — prevents silent failures |
| P0 | Implement custom MX nodes (TRO, marketplace, minter) | Medium | High — enables full ecosystem interaction |
| P0 | Define workflow inputs | Low | Medium — proper input validation |
| P0 | Fix cron frequency | Low | Medium — correct trading cadence |
| P1 | Volatility-based position sizing | Medium | High — better risk/reward |
| P1 | Trailing stops | Medium | High — lock profits |
| P1 | Correlation check | Low | Medium — avoid concentration risk |
| P1 | GreenSmoke signal integration | Medium | High — uses existing alpha |
| P1 | Performance metrics tracking | Medium | High — enables strategy iteration |
| P1 | Remove redundant CI workflows | Low | Low — cleaner repo |
| P1 | Fix BigInt precision | Low | Medium — correct on-chain data |
| P1 | Implement contrarian brain | Low | Medium — diversified strategy |
| P1 | Circuit breaker on executor | Low | High — prevent runaway failures |
| P2 | Dynamic budget allocation | Medium | Medium — adapt to performance |
| P2 | Real-time fee estimation | Low | Medium — accurate profit validation |
| P2 | Contract query caching | Low | Low — faster workflow runs |
| P2 — Remove 6 unused nodes | Low | Low — cleaner workflow |
| P3 | Add actual ML/AI inference | High | Unknown — could improve signal quality |

---

## Recommended Next Steps

1. **Immediate:** Fix the executor stub (P0) — without it, LIA is paper trading only
2. **Immediate:** Fix the input pattern (P0) — prevents trading on bad data
3. **Short-term:** Add GreenSmoke integration + trailing stops + position sizing (P1)
4. **Short-term:** Add performance metrics tracking (P1) — you can't optimize what you can't measure
5. **Medium-term:** Dynamic allocation, real ML inference, MEV protection

---

*Generated by Gz — Vellum Assistant for Nelson Tuduri (@tudurioriginal)*

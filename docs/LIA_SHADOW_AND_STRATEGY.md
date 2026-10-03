# LIA — Shadow trading & strategy engine (paper)

**Last verified:** 2026-10-03 · Code in `apps/frontend/src/lia/`  
**LIA_LIVE_TRADING:** must remain **0** / unset. This module never signs MultiversX TX.

## What was consolidated

Blueprints MSM-V1, MSAB-V1, STVP-V1, SAB-V1 → one implementation surface:

| Piece | Path |
|-------|------|
| 10-col matrix + strategies | `lia/types.ts` |
| Strategy switcher | `lia/strategySwitcher.ts` |
| Decision cycle | `lia/decisionCycle.ts` |
| Virtual treasury + fees/slippage | `lia/shadowLedger.ts` |
| Aura mapping | `STRATEGY_AURA` → front `ambientAura` |

## Modes

| Mode | Capital | TX |
|------|---------|-----|
| **Shadow / Paper** | `localStorage` ledger | none |
| **Real** | — | **not implemented here** |

## Decision loop

1. SCAN — build `Matrix10` (`matrixFromPulse` or backend later)
2. SCORE — confidence / trend already in matrix
3. SELECT — `selectStrategy`
4. VALIDATE — size ≤ 10% RCE, liquidity floor
5. EXECUTE — `applyShadowIntent` only

## STVP 7-day protocol (ops, not automated)

Days 1–2 stability · 3–4 signal quality · 5–6 volatility · 7 benchmark vs HODL EGLD.  
Promote to micro-real **only** after KPIs + legal/risk review (slot/LIA separate).

## Aura bridge

| Strategy family | Aura |
|-----------------|------|
| Trend / sentiment / correlation | bull |
| Mean reversion | bear |
| Yield / compound | reward |
| Delta-neutral / arb / range | stable |
| Sentinel | risk |

## Explicit non-goals (this PR)

- No `LIA_LIVE_TRADING=1`
- No PEM / auto-sign
- No MEV mempool bot
- No governance frontrun automation

# Validation — Arbitrage, Yield, Compounding, TP log/exp

## 1. Modules (verified)

| Module | Role | Status |
|--------|------|--------|
| `strategies.micro_arb` | Spread DEX > 2.5× fees → BUY | OK |
| `strategies.mean_reversion_liquid` | VWAP dislocation + RSI | OK |
| `strategies.momentum_regime` | Trend + GreenSmoke | OK |
| `strategies.yield_first` | conf < 0.65 → YIELD | OK |
| `strategies.fuse_signals` | SELL≥0.6 → BUY≥0.62 → YIELD | OK |
| `compound_engine` | +1% net, SL −1%, BE, trail, 70/30 | OK |
| `trailing_stop` | ATR/hybrid, R partials, step tighten | OK |
| `take_profit_curves` | fixed / exp / log / ladder | **NEW** |

## 2. TP curves

### Exponential
`target_k = entry × (1 + g0 × φ^k)` — early small TP, later runners. Default g0=0.8%, φ=1.6, n=4.

### Logarithmic
`gross_k = g_min × exp(u × ln(g_max/g_min))` — denser early targets, heavier size on first levels.

### Ladder R
`target = entry × (1 + risk_pct × R)` with R∈{1,1.5,2,3} aligned to SL 1%.

### Fixed (legacy)
Single target = gross needed for +1% **net** after fee model.

## 3. Unit validation (local run)

```
fixed  levels=1 net≈0.014 (path to +5%)
exp    levels=4 net≈0.0098
log    levels=5 net≈0.0076
ladder levels=4 net≈0.0089
compound 100USD × 50 wins × eff 0.75 → ~130 USD
```

All plans: sorted prices, fractions ≤ 1, `validate_plan.ok == True`.

## 4. Compounding math

```
equity *= (1 + net × compound_fraction × efficiency)
```

- compound_fraction = **0.70** (30% yield sleeve)
- efficiency = 1.0 full TP fixed; ~0.5–0.8 with scale-out
- SL / halt 3 losses / fees prevent naive (1.01)^1000 fantasy

## 5. Runtime wiring

```text
DataHub → MR + MOM + ARB + yield_first
       → fuse_signals
       → CompoundCircuit.can_open
       → open_trade + build_tp_plan(tp_mode)
       → on_tick: BE + trail + TpPlan.on_price_long
       → PARTIAL_TP / TAKE_PROFIT / STOP_LOSS
       → close_trade → streak + surplus 30%
```

Recommended defaults:
- **Serial pure compound:** `tp_mode=fixed`
- **Capital protection:** `tp_mode=log`
- **Runner after scale-out:** `tp_mode=exp` or `ladder`

```bash
python -m lia.circuit.take_profit_curves
```

## 6. Arb & yield rules (unchanged, confirmed)

- Arb only if edge > fees×2.5 and liquid
- Yield if no trade edge — do not force compound
- TRO never held operationally

# Architecture P3 (production-oriented)

## Logical layout (Brain / Body / Guardian)

| Layer | Path | Role |
|-------|------|------|
| **Brain** | `lia/brain/` | Strategies, position sizing, decision helpers |
| **Guardian** | `lia/guardian/` | `beta_strike.yaml` enforcement, kill-switch |
| **Body** | `apps/frontend/` | React / Three.js (Pages deploy root) |
| **Calldata** | `lia/calldata/` | TX builders (swap, ESDT) |
| **Shadow** | `lia/shadow/` | Paper sprint |
| **Config** | `config/beta_strike.yaml` | ROE hard limits |

**No wholesale move of frontend into `src/body/`** — would break Vite + GitHub Pages paths. Logical split is enforced in packages + docs.

## Strategies catalog

See `lia/brain/strategies.py` — includes front switcher set + **Momentum breakout**, **Liquidity sniper**, **Micro proof**.

## Guardian flow

```
Intent → preflight_trade(beta_strike) → kill_switch? → (paper | live broadcast)
```

Live still requires `LIA_LIVE_TRADING=1` **and** preflight OK.

## Proven dust (mainnet)

- ESDT TRO, wrapEgld, WEGLD→USDC swap (see `docs/MICRO_PROOF_*`)

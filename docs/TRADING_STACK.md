# LIA Trading Stack — slippage · cross-chain arb · dynamic trail · security

## Ordre d’exécution

```
DEFENSE
  → Venue + leverage policy
    → Guardian spiral
      → Slippage guard (size × depth × vol)
        → Micro fee skip
          → Secure TP (log) + Dynamic trail open
            → ticks: trail · partials · profit lock 70%
  → Cross-chain arb scan (signals / paper intents)
```

`LIA_LIVE_TRADING=0` ⇒ PAPER.

## Slippage (`lia/risk/slippage.py`)

| Param | Défaut |
|-------|--------|
| base | 30 bps |
| max | 150 bps |
| impact | `k * sqrt(notional/depth)` |
| bridge extra | +40 bps |

`guard_quote` → `fill_price` worst-case + reject si > cap.

## Cross-chain arb (`lia/circuit/cross_chain_arb.py`)

- **Non atomique** (pas de bridge auto v1)
- MVX mids (block arb) + mids SOL/HL injectés (DataHub)
- Coûts : fees + slip buy/sell + **bridge penalty 80 bps**
- Edge min brute 1.5 % ; net min ~20 bps pour `actionable`
- Size max `LIA_MAX_CROSS_ARB_USD` (défaut 25)
- Intents PAPER tant que live flag off

```python
stack.scan_cross_arb(sol_mid=28.5, hl_mid=None, force_paper=True)
```

## Dynamic trailing (`lia/risk/dynamic_trail.py`)

Wrapper de `trailing_stop.py` :
- hybrid / percent / atr
- break-even + step tighten
- à l’arrêt : **exit_price_slippage_adj**
- persist `data/lia_trailing_state.json`

## Sécurité (continuité)

| Gate | Effet |
|------|--------|
| LIA_LIVE_TRADING | bloqué live |
| leverage policy | SOL/HL live ≤1.5× |
| guardian spiral | lockdown compoundable |
| profit lock 70% | pas de re-risk total |
| slippage cap | pas de fill hors budget |
| arb non-atomic | warning bridge manuel |
| max arb USD | micro only |

## Tests

```bash
python -m lia.risk.test_slippage_arb_trail
python -m lia.risk.test_secure_tp
```
